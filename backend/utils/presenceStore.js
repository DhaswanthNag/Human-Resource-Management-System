const activeUsers = new Map();
const ONLINE_TIMEOUT = 60 * 1000;

const updateHeartbeat = (userId, role) => {
  activeUsers.set(`${role}:${userId}`, Date.now());
};

const isUserOnline = (userId, role) => {
  const key = `${role}:${userId}`;
  const lastSeen = activeUsers.get(key);

  if (!lastSeen || Date.now() - lastSeen > ONLINE_TIMEOUT) {
    activeUsers.delete(key);
    return false;
  }

  return true;
};

module.exports = { updateHeartbeat, isUserOnline };