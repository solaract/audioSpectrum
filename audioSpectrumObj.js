//option{
//    auIn:String,      inputId
//    speCan:String     canvasId
//}
var audioSpectrum = (function(){
    var AudioSpectrum = function(option){
        this.audioInput = document.getElementById(option.auIn);
        this.speCan = document.getElementById(option.speCan);
        this.file = null;
        this.fileName = null;
        this.playing = 0;
        this.animationId = null;
        //部分属性在init初始化
        this.init();
    };
    AudioSpectrum.prototype = {
        addListener:function(){
            var that = this;
            that.audioInput.onchange = function(){
                if(that.audioInput.files.length !== 0){
                    that.file = that.audioInput.files[0];
                    that.fileName = that.file.name;
//        alert('start');
                    that.speStart();
                }
            };
        },
        speStart:function(){
            var that = this;
            var fr = new FileReader();
            fr.onload = function(e){
                var fileResult = e.target.result;
                //解码
                that.audioContext.decodeAudioData(fileResult,
                    function(buffer){
//                alert('analyze');
                        // console.log(buffer);
                        that.speAnalyze(buffer);
                    },
                    function(e){
                        alert('解码失败');
                    })
            };
            fr.readAsArrayBuffer(that.file);
        },
        speAnalyze:function(buffer){
            var that = this;
            if(this.playing){
                if (!this.audioBufferSourceNode.start) {
                    this.audioBufferSourceNode.start = this.audioBufferSourceNode.noteOn //in old browsers use noteOn method
                    this.audioBufferSourceNode.stop = this.audioBufferSourceNode.noteOff //in old browsers use noteOff method
                };
                this.audioBufferSourceNode.stop(0);
                cancelAnimationFrame(this.animationId);
                this.playing = 0;
            }
            //source不可复用，需要创建新的source
            this.audioBufferSourceNode = this.audioContext.createBufferSource();
            //source -> analyser
            this.audioBufferSourceNode.connect(this.analyser);
            this.audioBufferSourceNode.onended = function(){
                that.audioEnd(that);
            }
            //为source注入音频流
            this.audioBufferSourceNode.buffer = buffer;
            //播放
            this.audioBufferSourceNode.start(0);
            this.playing = 1;
            this.speDrawColumn(this.analyser);
        },
        speDrawColumn:function(analyser){
            var that = this,
                cwidth = this.speCan.width,
                //-2留出能量条基础高度
                cheight = this.speCan.height- 2,
                //频域强度转换比例
                rate = (cheight + 2)/300,
                //能量条高度
                value,
                // tStart,tEnd,
                //能量条宽度、间距、数量
                meterWidth = 10,
                gap = 2,
                allWidth = meterWidth + gap,
                meterN = cwidth/allWidth,
                ctx = this.speCan.getContext('2d'),
                //帽头高度
                capHeight = 2,
                //帽头样式
                capStyle = '#00aecd',
                //帽头位置记录
                capPosition = [],
                //能量条样式   纵向渐变
                gradient = ctx.createLinearGradient(0,0,0,cheight + 2);
            //analyser.frequencyBinCount == 1024
            var bufferLength = this.analyser.frequencyBinCount;
            var arr = new Uint8Array(bufferLength);
            //对频域每次采样间距
            var step = Math.floor(bufferLength/meterN);
            if(step < 13){
                step = 13;
                meterN = bufferLength/step;
                allWidth = cwidth/meterN;
                meterWidth = allWidth - gap;
            }
            console.log(step);
            gradient.addColorStop(1,'#0f0');
            gradient.addColorStop(0.5,'#ff0');
            gradient.addColorStop(0,'#f00');
//    ctx.clearRect(0, 0, cwidth, cheight);
            var draw = function(){
                //Copies the current frequency data into a Uint8Array (unsigned byte array) passed into it
                that.analyser.getByteFrequencyData(arr);
                ctx.clearRect(0,0,cwidth,cheight);
                //console.log(arr);
                //console.log('min:'+analyser.minDecibels+';max:'+analyser.maxDecibels);
                //判断不为空
                // if(parseInt([].join.call(arr,''))){
                    //每竖条填充绘图
                    for(var i = 0;i < meterN;i++){
                        value = arr[i*step] * rate;
                        if(value > cheight)value = cheight;
                        //绘制帽头
                        ctx.fillStyle = capStyle;
                        //初次推入数据
                        if(capPosition[i]){
                            capPosition.push(value);
                            ctx.fillRect(i*allWidth,cheight - capPosition[i],meterWidth,capHeight);
                        }
                        //帽头缓降
                        if(capPosition[i] > value){
                            capPosition[i]--;
                            ctx.fillRect(i*allWidth,cheight - capPosition[i],meterWidth,capHeight);
                            //帽头陡升
                        }else{
                            ctx.fillRect(i*allWidth,cheight - value,meterWidth,capHeight);
                            capPosition[i] = value;
                        }
                        //绘制能量条
                        ctx.fillStyle = gradient;
                        ctx.fillRect(i*allWidth,cheight - value + capHeight,meterWidth,cheight);
//            console.log(arr[i]);
                    }
                    tStart = new Date();
                    //播放完毕后退出
                // }
                // else{
                //     tEnd = new Date();
                //     if(((tEnd - tStart)/1000) > 5){
                //         this.playing = 0;
                //         return;
                //     }
                // }
                //console.log(1);
                //自动更新画面
                this.animationId = requestAnimationFrame(draw);
            };
            this.animationId = requestAnimationFrame(draw);
            //draw();
        },
        audioEnd:function(that){
            cancelAnimationFrame(this.animationId);
            this.playing = 0;
            alert(0);
        },
        init:function(){
            window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
            window.requestAnimationFrame =window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
            try{
                this.audioContext = new AudioContext();
                //创建source
                this.audioBufferSourceNode = null;
                //创建analyser
                this.analyser = this.audioContext.createAnalyser();
                //analyser -> destination
                
                this.analyser.connect(this.audioContext.destination);
            }catch(e){
                alert('你的浏览器不支持AudioContext');
            }
            this.addListener();
        }
    };
    return AudioSpectrum;
})();
var a = new audioSpectrum({
    auIn:'music',
    speCan:'spectrum'
});