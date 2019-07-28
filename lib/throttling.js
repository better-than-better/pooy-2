const { Readable } = require('stream');

class Throttling extends Readable {
  constructor(props) {
    super(props);

    const { incomingStream, limitSize = 1024, encoding = 'utf-8' } = props;

    let beforeTime = Date.now();
    let offBuff = new Buffer('', encoding);
    let timeCount = 0;
    let unConsumedSize = limitSize;

    const onData = (chunk) => {
      const now = Date.now();
      chunk = Buffer.concat([offBuff, chunk]);

      // 即时消费 chunk
      function resumeChunk(reader) {
        if (unConsumedSize) return offBuff = chunk;

        if (unConsumedSize > chunk.length) {
          reader.push(chunk);
          offBuff = new Buffer('', encoding);
          unConsumedSize = unConsumedSize - chunk.length;
        } else {
          reader.push(chunk.slice(0, unConsumedSize));
          offBuff = chunk.slice(unConsumedSize - chunk.length);
          unConsumedSize = 0;
        }
      }

      if (now - beforeTime < 1000) return resumeChunk(this);

      unConsumedSize = limitSize;
      beforeTime = now;
      timeCount++;
    };

    const onEnd = () => {
      setTimeout(() => {
        if (!offBuff.length) return this.push(null);

        function foo(reader, buffer, limitSize, lastIndex = 0) {
          let timer = setTimeout(() => {
            const _bf = buffer.slice(lastIndex, lastIndex + limitSize);

            reader.push(_bf);

            clearTimeout(timer);
            timer = null;

            if (lastIndex >= buffer.length) {
              reader.push(null);
            } else {
              foo(reader, buffer, limitSize, lastIndex + limitSize);
            }
          }, 1000);
        }
    
        foo(this, offBuff, limitSize, 0);
      }, timeCount * 1000);
    };

    incomingStream.on('data', onData);
    incomingStream.on('end', onEnd);
  }

  _read() {
    // console.log('read.....');
  }
}

module.exports = Throttling;
