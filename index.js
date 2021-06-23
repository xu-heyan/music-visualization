let myp5 = new p5((sketch) => {
  //要取得多少个不同频率的音量数据
  const ORI_NUM = 64;
  //要显示多少个不同频率的音量数据
  const NUM = 48;
  //图案的最长和最短
  const MIN_LENGTH = 112.5;
  const MAX_LENGTH = 185;
  //那个一条一条的图案的宽高
  const WID = 3;
  const HIG = 70;
  //最后的颜色再变得亮一点，有多亮
  const WHITE = 20;
  //图案里，条的颜色默认值rgba
  let color1 = [255, 255, 255, 180];
  //图案里，面的颜色默认值rgba
  let color2 = [255, 255, 255, 150];
  //存储fft对象
  let fft;
  sketch.setup = () => {
    //取得图片dom并载入
    let imgDom = document.querySelector("#musicImg");
    sketch.loadImage(imgDom.src, afterLoadImg);
    //要把canvas放到哪个div里面，这个div的宽高要在css里设定好
    let div = document.querySelector("#p5sketch");
    //创建画布
    sketch.createCanvas(div.offsetWidth, div.offsetHeight);
    //取得AudioContext
    sketch.audioContext_ = sketch.getAudioContext();
    //取得声音dom，注意vue项目里只能有一个audio tag，切换歌曲时只变src
    let el = document.querySelector("audio");
    //根据声音dom创建web audio API source node, 并且连接主输出
    const source = sketch.audioContext_.createMediaElementSource(el);
    source.connect(p5.soundOut);
    //0.8是变化程度，越小图案越抖
    fft = new p5.FFT(0.8, ORI_NUM);
    fft.setInput(source);
    sketch.angleMode(sketch.DEGREES);
  };
  //重新载入img
  sketch.reloadImg_ = () => {
    let imgDom = document.querySelector(".middle img");
    sketch.loadImage(imgDom.src, afterLoadImg);
  };
  sketch.draw = () => {
    sketch.clear();
    //取得不同频率下的音量
    let spectrum = fft.analyze();
    sketch.noStroke();
    sketch.fill(
      color2[0] + WHITE,
      color2[1] + WHITE,
      color2[2] + WHITE,
      color2[3]
    );
    sketch.translate(sketch.width / 2, sketch.height / 2);
    //画那个面面
    sketch.beginShape();
    for (let i = 0; i < NUM; i++) {
      let r = sketch.map(spectrum[i], 0, 255, MIN_LENGTH, MAX_LENGTH);
      let angle = sketch.map(i, 0, NUM - 1, -120, 60);
      //画那个条条，先画半个，因为要对称
      sketch.push();
      sketch.fill(
        color1[0] + WHITE,
        color1[1] + WHITE,
        color1[2] + WHITE,
        color1[3]
      );
      sketch.rotate(angle - 30);
      sketch.rect(-WID / 2, r - HIG, WID, HIG, WID);
      sketch.pop();
      //面面的点
      let x = r * sketch.cos(angle);
      let y = r * sketch.sin(angle);
      sketch.curveVertex(x, y);
    }
    for (let i = NUM - 1; i >= 0; i--) {
      let r = sketch.map(spectrum[i], 0, 255, MIN_LENGTH, MAX_LENGTH);
      let angle = sketch.map(i, NUM - 1, 0, 60, 240);
      //另半个条条
      sketch.push();
      sketch.fill(
        color1[0] + WHITE,
        color1[1] + WHITE,
        color1[2] + WHITE,
        color1[3]
      );
      sketch.rotate(angle - 30);
      sketch.rect(-WID / 2, r - HIG, WID, HIG, WID);
      sketch.pop();
      //还是面面的点
      let x = r * sketch.cos(angle);
      let y = r * sketch.sin(angle);
      sketch.curveVertex(x, y);
    }
    sketch.endShape(sketch.CLOSE);

    // sketch.fill(255, 255, 255)
    // sketch.ellipse(0, 0, 225)
  };
  //这个方法是用来处理谷歌浏览器不让自动播放的政策的，用户没给手势AudioContext用不了
  sketch.resumeContext_ = () => {
    sketch.audioContext_.resume();
  };
  function afterLoadImg(img) {
    img.loadPixels();
    //取得图片的两个主色调
    let twoColors = getTwoColors(img);
    //如果太黑了就调亮点，不然在黑色背景上看不出来
    for (const col of twoColors) {
      if (col.r < 40 && col.g < 40 && col.b < 40) {
        col.r += 40;
        col.g += 40;
        col.b += 40;
      }
    }
    //把计算出来的颜色赋值给面面和条条
    color1[0] = twoColors[1].r;
    color1[1] = twoColors[1].g;
    color1[2] = twoColors[1].b;
    color2[0] = twoColors[0].r;
    color2[1] = twoColors[0].g;
    color2[2] = twoColors[0].b;
  }
  function getTwoColors(img) {
    //把图片先整成10*10的，这样计算量小一些
    img.resize(10, 10);
    //循环这100个像素，把他们根据七种颜色分类
    let classifiedPix = {
      color0: [],
      color1: [],
      color2: [],
      color3: [],
      color4: [],
      color5: [],
      color6: [],
    };
    for (let i = 0; i < 400; i += 4) {
      let r = img.pixels[i];
      let g = img.pixels[i + 1];
      let b = img.pixels[i + 2];
      let hue = getHue(r, g, b);
      classifiedPix["color" + sketch.round(hue / 60)].push(r, g, b);
    }
    //选出最多的两种颜色类
    let color1sts = [];
    let color2nds = [];
    for (let cor in classifiedPix) {
      if (classifiedPix[cor].length > color1sts.length) {
        color1sts = classifiedPix[cor];
        continue;
      } else if (classifiedPix[cor].length > color2nds.length) {
        color2nds = classifiedPix[cor];
      }
    }
    //计算这两种颜色类的具体颜色
    let color1st = { r: 0, g: 0, b: 0 };
    let color2nd = { r: 0, g: 0, b: 0 };
    for (let i = 0; i < color1sts.length; i += 3) {
      let r = color1sts[i] / (color1sts.length / 3);
      let g = color1sts[i + 1] / (color1sts.length / 3);
      let b = color1sts[i + 2] / (color1sts.length / 3);
      color1st.r += r;
      color1st.g += g;
      color1st.b += b;
    }
    for (let i = 0; i < color2nds.length; i += 3) {
      let r = color2nds[i] / (color2nds.length / 3);
      let g = color2nds[i + 1] / (color2nds.length / 3);
      let b = color2nds[i + 2] / (color2nds.length / 3);
      color2nd.r += r;
      color2nd.g += g;
      color2nd.b += b;
    }
    return [color1st, color2nd];
  }
  //根据rgb的数值取得色调，也就是hsv里的h
  function getHue(red, green, blue) {
    let min = Math.min(Math.min(red, green), blue);
    let max = Math.max(Math.max(red, green), blue);

    if (min == max) {
      return 0;
    }
    let hue;
    if (max == red) {
      hue = (green - blue) / (max - min);
    } else if (max == green) {
      hue = 2 + (blue - red) / (max - min);
    } else {
      hue = 4 + (red - green) / (max - min);
    }
    hue = hue * 60;
    if (hue < 0) hue += 360;
    return Math.round(hue);
  }
}, "p5sketch");
let audioDom = document.getElementById("armin");
let imgDom = document.getElementById("musicImg");
audioDom.addEventListener("play", () => {
  imgDom.className = "playing";
  myp5.resumeContext_();
});
audioDom.addEventListener("pause", () => {
  imgDom.className = "playing paused";
});
