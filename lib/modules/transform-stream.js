const { Transform, Readable, Stream } = require('stream');

class ReadableStream extends Readable {
  constructor(props) {
    super(props);
  }

  write(data) {
    if (Buffer.isBuffer(data) || typeof data === 'string') {
      this.push(data);
    } else {
      this.push(JSON.stringify(data));
    }
  }

  end() {
    this.push(null);
  }
}


/**
 * eat it
 * @param {Transform} pig 🐷
 * @param {Buffer} foods 食物总量
 * @param {Number} meal 单次最多最多
 * @param {Function} done 吃完了通知下
 * @param {Boolean} fullMode 能否吃剩
 */
function eat(pig, foods, meal, done, fullMode) {
  const c = foods.length / meal;
  const count = fullMode ? Math.floor(c) : Math.ceil(c);

  if (foods.length === 0) return done();

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      // console.log(`    🐷 ---> 第${i + 1}口`);
      pig.push(foods.slice(i * meal, (i + 1) * meal ));
      if (i === count - 1) done();
    }, 1000 * i);
  }

  // console.log(`\n 🤔 当前饭量:${meal}, 锅里有${foods.length}, 分${count}次吃; ${fullMode ? 'PS: 这是一只节俭的 🐖' : ''}`);

  return foods.slice(meal * count);
}

class Throttling extends Transform {
  constructor(props) {
    super(props);

    if (typeof props.limitSize !== 'number' && props.limitSize) {
      throw TypeError('limitSize is not a number');
    }

    this.limitSize = props.limitSize;
    this.data = [];
    this.time = Date.now();
  }

  _transform(chunk, encoding, done) {
    const size = this.limitSize;

    this.data.push(chunk);
    chunk = Buffer.concat(this.data);

    this.data = [];
    this.data.push(eat(this, chunk, size, done, false));
  }

  _flush(done) {
    const size = this.limitSize;
    const chunk = Buffer.concat(this.data);
    eat(this, chunk, size, done, true);
  }
}

function transformStream(incoming, limitSize) {
  limitSize = limitSize || Number.MAX_VALUE;

  if (typeof limitSize !== 'number') throw TypeError('transformStream: limitSize must be a number');

  if (incoming instanceof Stream) {
    return incoming.pipe(new Throttling({ limitSize: Math.abs(limitSize) }));
  }

  const reader = new ReadableStream();

  reader.write(incoming);
  reader.end();

  return reader.pipe(new Throttling({ limitSize: Math.abs(limitSize) }));
}

module.exports = transformStream;
