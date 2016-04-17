function MockDoc(text) {
  this.type = {name: 'text'};
  this.data = text || '';
  this.subscribed = false;
  this.errorOnSubscribe = null;
  this._opListeners = [];
}
module.exports = MockDoc;

MockDoc.prototype.subscribe = function(callback) {
  var doc = this;
  process.nextTick(function() {
    doc.subscribed = true;
    callback(doc.errorOnSubscribe);
  });
};

MockDoc.prototype.create = function(data, type, source, callback) {
  if (typeof type === 'function' || source || callback) {
    throw new Error('MockDoc does not support the "source" and "callback" arguments');
  }
  if (this.type) {
    throw new Error('Document already exists');
  }
  this.data = data;
  this.type = {name: type};
};

MockDoc.prototype.submitOp = function(op, source, callback) {
  if (typeof source === 'function' || callback) {
    throw new Error('MockDoc does not support an op callback');
  }
  if (!this.type) {
    throw new Error("Document hasn't been created yet");
  }
  this._applyOp(op);
  this._opListeners.forEach(function (f) { f(op, source); });
};

MockDoc.prototype._applyOp = function(op) {
  var codeMirror = this.codeMirror;
  var text = this.data;
  var index = 0;

  op.forEach(function(part) {
    switch (typeof part) {
      case 'number': // skip n chars
        index += part;
        break;
      case 'string': // "chars" - insert "chars"
        text = text.slice(0, index) + part + text.slice(index);
        index += part.length;
        break;
      case 'object': // {d: num} - delete `num` chars
        text = text.slice(0, index) + text.slice(index + part.d);
        break;
    }
  });

  this.data = text;
};

MockDoc.prototype.receiveRemoteOp = function(op) {
  this._opListeners.forEach(function (f) { f(op, false); });
};

MockDoc.prototype.on = function(event, listener) {
  if (event !== 'op') {
    throw new Error('MockDoc not prepared for event "' + event + '"');
  }
  this._opListeners.push(listener);
};

MockDoc.prototype.removeListener = function(event, listener) {
  if (event !== 'op') {
    throw new Error('MockDoc not prepared for event "' + event + '"');
  }

  var listenerIndex = this._opListeners.indexOf(listener);

  if (listenerIndex > -1) {
    this._opListeners.splice(listenerIndex, 1);
  }
};
