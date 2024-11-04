'use strict';

const Connection = require('../index.js').Connection;

class PoolConnection extends Connection {
  constructor(pool, options) {
    super(options);
    this._pool = pool;
    // The last active time of this connection
    this.lastActiveTime = Date.now();
    // When a fatal error occurs the connection's protocol ends, which will cause
    // the connection to end as well, thus we only need to watch for the end event
    // and we will be notified of disconnects.
    // REVIEW: Moved to `once`
    this.once('end', () => {
      this._removeFromPool();
    });
    this.once('error', () => {
      this._removeFromPool();
    });
  }

  release() {
    if (!this._pool || this._pool._closed) {
      return;
    }
    // update last active time
    this.lastActiveTime = Date.now();
    this._pool.releaseConnection(this);
  }

  promise(promiseImpl) {
    const PromisePoolConnection = require('../promise').PromisePoolConnection;
    return new PromisePoolConnection(this, promiseImpl);
  }

  end(callback) {
    this._removeFromPool();
    super.end(callback);
  }

  destroy() {
    this._removeFromPool();
    super.destroy();
  }

  _removeFromPool() {
    if (!this._pool || this._pool._closed) {
      return;
    }
    const pool = this._pool;
    this._pool = null;
    pool._removeConnection(this);
  }
}

PoolConnection.statementKey = Connection.statementKey;
module.exports = PoolConnection;
