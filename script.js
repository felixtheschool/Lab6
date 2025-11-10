// Master function: getUserContent ties everything together
async function getUserContent(userId) {
  console.log('=== Fetching all user content ===');
  try {
    // Step 1: Fetch user profile
    const user = await fetchUserProfile(userId);
    console.log('Step 1: User profile retrieved -', user.name);

    // Step 2: Fetch user's posts
    const posts = await fetchUserPosts(userId);
    console.log('Step 2: Posts retrieved -', posts.length);

    // Step 3: Fetch comments for all posts (in parallel)
    const commentsArrays = await Promise.all(posts.map(post => fetchPostComments(post.postId)));
    console.log('Step 3: Comments retrieved');

    // Step 4: Combine all data into one object
    const postsWithComments = posts.map((post, idx) => ({ ...post, comments: commentsArrays[idx] }));
    const allContent = {
      user,
      posts: postsWithComments
    };
    return allContent;
  } catch (error) {
    console.error('Failed to fetch user content:', error.message);
    throw error;
  }
}

window._lab6.getUserContent = getUserContent;
// script.js
// Demonstrates sequential vs parallel fetch patterns using simulated delayed promises.

// Simulated fetch: returns a promise that resolves after `delayMs` with a simple message.
function simulatedFetch(name, delayMs) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ name, delayMs, time: new Date().toISOString() });
    }, delayMs);
  });
}

// Task A: fetchUserProfile(userId)
// Returns a Promise that resolves after 1 second with a user object
function fetchUserProfile(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // made-up user data; in a real app you'd fetch from a server
      const user = {
        id: userId,
        name: `User ${userId} Name`,
        email: `user${userId}@example.com`,
        username: `user${userId}`,
      };
      resolve(user);
    }, 1000);
  });
}

// Utility to render results into the #results element
function renderResults(title, items, durationMs) {
  const out = document.getElementById('results');
  const container = document.createElement('div');
  container.style.border = '1px solid #ccc';
  container.style.padding = '0.5rem';
  container.style.marginBottom = '0.5rem';

  const heading = document.createElement('strong');
  heading.textContent = `${title} (took ${durationMs} ms)`;
  container.appendChild(heading);

  const ul = document.createElement('ul');
  items.forEach(it => {
    const li = document.createElement('li');
    li.textContent = `${it.name} — simulated ${it.delayMs}ms — resolved at ${it.time}`;
    ul.appendChild(li);
  });
  container.appendChild(ul);
  out.prepend(container);
}

// Disable/enable buttons while running
function setRunning(isRunning) {
  document.getElementById('sequentialBtn').disabled = isRunning;
  document.getElementById('parallelBtn').disabled = isRunning;
}

// Sequential: wait for each fetch to finish before starting the next
async function runSequential() {
  setRunning(true);
  const delays = [800, 600, 400];
  const start = performance.now();
  const results = [];
  for (let i = 0; i < delays.length; i++) {
    // Each fetch waits for the previous to finish
    // In a real scenario replace simulatedFetch with fetch(url)
    const res = await simulatedFetch(`item-${i + 1}`, delays[i]);
    results.push(res);
  }
  const duration = Math.round(performance.now() - start);
  renderResults('Sequential fetches', results, duration);
  setRunning(false);
}

// Parallel: start all fetches at once and wait for all to finish
async function runParallel() {
  setRunning(true);
  const delays = [800, 600, 400];
  const start = performance.now();
  // Start all promises without awaiting
  const promises = delays.map((d, i) => simulatedFetch(`item-${i + 1}`, d));
  // Wait for all to complete
  const results = await Promise.all(promises);
  const duration = Math.round(performance.now() - start);
  renderResults('Parallel fetches (Promise.all)', results, duration);
  setRunning(false);
}

// Wire buttons when DOM is ready

// Helper to format and display results
function displayResults(data, container) {
  container.innerHTML = '';
  if (!data) {
    container.textContent = 'No data to display.';
    return;
  }
  // User info
  if (data.profile || data.user) {
    const user = data.profile || data.user;
    const userDiv = document.createElement('div');
    userDiv.innerHTML = `<strong>User:</strong> ${user.name} (${user.username})<br>Email: ${user.email}`;
    container.appendChild(userDiv);
  }
  // Timing
  if (data.durationMs !== undefined) {
    const timing = document.createElement('div');
    timing.textContent = `Total time: ${data.durationMs} ms`;
    container.appendChild(timing);
  }
  // Errors
  if (data.errors && data.errors.length) {
    const errDiv = document.createElement('div');
    errDiv.style.color = 'red';
    errDiv.innerHTML = `<strong>Errors:</strong> <ul>` + data.errors.map(e => `<li>${e.step}: ${e.message}</li>`).join('') + `</ul>`;
    container.appendChild(errDiv);
  }
  // Posts and comments
  if (data.posts && data.posts.length) {
    data.posts.forEach(post => {
      const postDiv = document.createElement('div');
      postDiv.style.marginTop = '1em';
      postDiv.innerHTML = `<strong>Post #${post.postId}:</strong> ${post.title}<br>${post.content}`;
      // Comments
      if (post.comments && post.comments.length) {
        const commentsList = document.createElement('ul');
        post.comments.forEach(c => {
          const li = document.createElement('li');
          li.textContent = `${c.username}: ${c.comment}`;
          commentsList.appendChild(li);
        });
        postDiv.appendChild(commentsList);
      } else if (post.commentsError) {
        const err = document.createElement('div');
        err.style.color = 'red';
        err.textContent = `Comments error: ${post.commentsError}`;
        postDiv.appendChild(err);
      }
      container.appendChild(postDiv);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const resultsDiv = document.getElementById('results');
  document.getElementById('sequentialBtn').addEventListener('click', async () => {
    setRunning(true);
    resultsDiv.textContent = 'Loading (sequential)...';
    try {
      const data = await window._lab6.fetchDataSequentially('demoUser');
      displayResults(data, resultsDiv);
    } catch (err) {
      resultsDiv.textContent = 'Error: ' + err.message;
    }
    setRunning(false);
  });
  document.getElementById('parallelBtn').addEventListener('click', async () => {
    setRunning(true);
    resultsDiv.textContent = 'Loading (parallel)...';
    try {
      const data = await window._lab6.fetchDataInParallel('demoUser');
      displayResults(data, resultsDiv);
    } catch (err) {
      resultsDiv.textContent = 'Error: ' + err.message;
    }
    setRunning(false);
  });
});

// Exported for console testing (optional)
window._lab6 = { simulatedFetch, runSequential, runParallel, fetchUserProfile };

// Task B: fetchUserPosts(userId)
// Returns a Promise that resolves after 1.5 seconds with an array of 3 posts
function fetchUserPosts(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const posts = [
        { postId: 1, userId: userId, title: `First post by ${userId}`, content: 'This is the first post content.' },
        { postId: 2, userId: userId, title: `Second post by ${userId}`, content: 'Some more content for post two.' },
        { postId: 3, userId: userId, title: `Third post by ${userId}`, content: 'Final post content in this small list.' },
      ];
      resolve(posts);
    }, 1500);
  });
}

// Export the new function as well
window._lab6.fetchUserPosts = fetchUserPosts;

// Task C: fetchPostComments(postId)
// Returns a Promise that resolves after 2 seconds with an array of comment objects
function fetchPostComments(postId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Add random failure (30% chance of error)
      if (Math.random() < 0.3) {
        reject(new Error('Failed to fetch comments'));
        return;
      }

      const comments = [
        { commentId: 1, postId: postId, username: 'commenter1', comment: 'Nice post!' },
        { commentId: 2, postId: postId, username: 'commenter2', comment: 'Thanks for sharing.' },
        { commentId: 3, postId: postId, username: 'commenter3', comment: 'Great read.' },
      ];
      resolve(comments);
    }, 2000);
  });
}

// Export the comments function
window._lab6.fetchPostComments = fetchPostComments;

// Task F / G: Error-handling versions of sequential and parallel fetches
async function fetchDataSequentially(userId) {
  console.log('Starting sequential fetch (with error handling)...');
  const startTime = Date.now();
  const errors = [];

  // Step 1: profile
  let profile = null;
  try {
    profile = await fetchUserProfile(userId);
    console.log('User profile retrieved');
  } catch (err) {
    console.error('Failed to retrieve profile:', err.message);
    errors.push({ step: 'profile', message: err.message });
  }

  // Step 2: posts
  let posts = [];
  try {
    posts = await fetchUserPosts(userId);
    console.log('Posts retrieved');
  } catch (err) {
    console.error('Failed to retrieve posts:', err.message);
    errors.push({ step: 'posts', message: err.message });
    posts = [];
  }

  // Step 3: comments for each post (sequentially)
  const postsWithComments = [];
  for (const post of posts) {
    try {
      const comments = await fetchPostComments(post.postId);
      console.log(`Comments retrieved for post ${post.postId}`);
      postsWithComments.push({ ...post, comments });
    } catch (err) {
      console.error(`Failed to retrieve comments for post ${post.postId}:`, err.message);
      errors.push({ step: `comments:${post.postId}`, message: err.message });
      postsWithComments.push({ ...post, comments: [], commentsError: err.message });
    }
  }

  const endTime = Date.now();
  console.log(`Sequential fetch (with error handling) took ${endTime - startTime}ms`);

  const result = {
    profile,
    posts: postsWithComments,
    errors,
    durationMs: endTime - startTime,
    message: errors.length ? 'Completed with errors (see errors array).' : 'Completed successfully',
  };

  return result;
}

// Parallel version with per-operation error handling
async function fetchDataInParallel(userId) {
  console.log('Starting parallel fetch (with error handling)...');
  const startTime = Date.now();
  const errors = [];

  // Fetch profile and posts at the same time, but use allSettled so one failure doesn't cancel the other
  const [profileSettled, postsSettled] = await Promise.allSettled([
    fetchUserProfile(userId),
    fetchUserPosts(userId),
  ]);

  let profile = null;
  if (profileSettled.status === 'fulfilled') {
    profile = profileSettled.value;
  } else {
    console.error('Failed to fetch profile:', profileSettled.reason.message);
    errors.push({ step: 'profile', message: profileSettled.reason.message });
  }

  let posts = [];
  if (postsSettled.status === 'fulfilled') {
    posts = postsSettled.value;
  } else {
    console.error('Failed to fetch posts:', postsSettled.reason.message);
    errors.push({ step: 'posts', message: postsSettled.reason.message });
    posts = [];
  }

  // Fetch comments for all posts in parallel, but handle failures per-post
  const commentPromises = posts.map((post) => fetchPostComments(post.postId));
  const commentsSettled = await Promise.allSettled(commentPromises);

  const postsWithComments = posts.map((post, idx) => {
    const settled = commentsSettled[idx];
    if (settled.status === 'fulfilled') {
      return { ...post, comments: settled.value };
    } else {
      console.error(`Failed to fetch comments for post ${post.postId}:`, settled.reason.message);
      errors.push({ step: `comments:${post.postId}`, message: settled.reason.message });
      return { ...post, comments: [], commentsError: settled.reason.message };
    }
  });

  const endTime = Date.now();
  console.log(`Parallel fetch (with error handling) took ${endTime - startTime}ms`);

  const result = {
    profile,
    posts: postsWithComments,
    errors,
    durationMs: endTime - startTime,
    message: errors.length ? 'Completed with errors (see errors array).' : 'Completed successfully',
  };

  return result;
}

// A convenience wrapper that tries the parallel approach and returns a user-friendly message
async function fetchDataWithErrorHandling(userId) {
  try {
    // Prefer parallel for speed while still handling errors per operation
    const data = await fetchDataInParallel(userId);
    if (data.errors && data.errors.length) {
      console.warn('Finished with some errors:', data.errors);
    }
    return data;
  } catch (err) {
    // This should be rare because fetchDataInParallel handles per-operation failures,
    // but just in case, return a minimal failure response.
    console.error('Unexpected fatal error in fetchDataWithErrorHandling:', err.message);
    return {
      profile: null,
      posts: [],
      errors: [{ step: 'fatal', message: err.message }],
      durationMs: 0,
      message: 'Failed to fetch data due to a fatal error.',
    };
  }
}

// Export the new error-handling functions
window._lab6.fetchDataSequentially = fetchDataSequentially;
window._lab6.fetchDataInParallel = fetchDataInParallel;
window._lab6.fetchDataWithErrorHandling = fetchDataWithErrorHandling;

// Task D: fetchDataSequentially(userId)
// Fetches profile, posts, and comments one after another
async function fetchDataSequentially(userId) {
  console.log('Starting sequential fetch...');
  const startTime = Date.now();

  try {
    // Step 1 - Await fetchUserProfile
    const profile = await fetchUserProfile(userId);
    console.log('User profile retrieved');

    // Step 2 - Await fetchUserPosts
    const posts = await fetchUserPosts(userId);
    console.log('Posts retrieved');

    // Step 3 - Loop through posts and await fetchPostComments for each
    const postsWithComments = [];
    for (const post of posts) {
      const comments = await fetchPostComments(post.postId);
      console.log(`Comments retrieved for post ${post.postId}`);
      postsWithComments.push({ ...post, comments });
    }

    const endTime = Date.now();
    console.log(`Sequential fetch took ${endTime - startTime}ms`);

    // Return all data combined
    return {
      profile,
      posts: postsWithComments,
      durationMs: endTime - startTime,
    };
  } catch (error) {
    console.error('Error in sequential fetch:', error.message);
    throw error;
  }
}

// Export sequential fetch function
window._lab6.fetchDataSequentially = fetchDataSequentially;

// Task E: fetchDataInParallel(userId)
// Fetches profile and posts in parallel, then fetches all comments for posts in parallel
async function fetchDataInParallel(userId) {
  console.log('Starting parallel fetch...');
  const startTime = Date.now();

  try {
    // Fetch user profile and posts at the same time
    const [profile, posts] = await Promise.all([
      fetchUserProfile(userId),
      fetchUserPosts(userId),
    ]);
    console.log('User and posts retrieved simultaneously');

    // Fetch comments for all posts in parallel
    const commentsPromises = posts.map((post) => fetchPostComments(post.postId));
    const commentsArrays = await Promise.all(commentsPromises);
    const postsWithComments = posts.map((post, idx) => ({ ...post, comments: commentsArrays[idx] }));

    const endTime = Date.now();
    console.log(`Parallel fetch took ${endTime - startTime}ms`);

    // Return combined data
    return {
      profile,
      posts: postsWithComments,
      durationMs: endTime - startTime,
    };
  } catch (error) {
    console.error('Error in parallel fetch:', error.message);
    throw error;
  }
}

// Export parallel fetch function
window._lab6.fetchDataInParallel = fetchDataInParallel;
