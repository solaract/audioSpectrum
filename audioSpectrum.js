window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
window.requestAnimationFrame =window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
try{
    audioContext = new AudioContext();
}catch(e){
    alert('你的浏览器不支持AudioContext');
}
var audioInput = document.getElementById('music');
var speCan = document.getElementById('spectrum');
var file,fileName;

audioInput.onchange = function(){
    if(audioInput.files.length !== 0){
        file = audioInput.files[0];
        fileName = file.name;
//        alert('start');
        speStart();
    }
};

function speStart(){
    var fr = new FileReader();
    fr.onload = function(e){
        var fileResult = e.target.result;
        //解码
        audioContext.decodeAudioData(fileResult,
            function(buffer){
//                alert('analyze');
               // console.log(buffer);
                speAnalyze(buffer);
        },
        function(e){
            alert('解码失败');
        })
    };
    fr.readAsArrayBuffer(file);
}

function speAnalyze(buffer){
    //创建source
    var audioBufferSourceNode = audioContext.createBufferSource();
    //创建analyser
    var analyser = audioContext.createAnalyser();
    //So for example, say we are dealing with an fft size of 2048. We return the AnalyserNode.frequencyBinCount value, which is half the fft, then call Uint8Array() with the frequencyBinCount as its length argument — this is how many data points we will be collecting, for that fft size.
    //实测中fftsize并没有带来任何变化，甚至不抛出错误？
    //当不像如下指定输入流时fftsize可以决定频域，正常抛出错误并改变frequencyBinCount的值，因为音频流本身指定了频域？
    // try{
    	// analyser.fftsize = 256; 
    // }catch(e){
    // 	alert(e.message);
    // }
    // console.log(analyser.frequencyBinCount);
    //source -> analyser -> destination
    audioBufferSourceNode.connect(analyser);
    analyser.connect(audioContext.destination);
    //为source注入音频流
    audioBufferSourceNode.buffer = buffer;
    //播放
    audioBufferSourceNode.start(0);
    speDraw(analyser);
}

function speDraw(analyser){
    var flag = 0;
    var cwidth = speCan.width,
    //-2留出能量条基础高度
        cheight = speCan.height- 2,
        value,tStart,tEnd,
        //能量条宽度、间距、数量
        meterWidth = 10,
        gap = 2,
        meterN = 800/12,
        ctx = speCan.getContext('2d'),
        //帽头高度
        capHeight = 2;
        //帽头样式
        capStyle = '#00aecd',
        //帽头位置记录
        capPosition = [],
        //能量条样式   纵向渐变
        gradient = ctx.createLinearGradient(0,0,0,300);
    //analyser.frequencyBinCount == 1024 
  	var bufferLength = analyser.frequencyBinCount;
    var arr = new Uint8Array(bufferLength); 
    //对频域每次采样间距
    var step = Math.floor(bufferLength/meterN);
    console.log(step);   
    gradient.addColorStop(1,'#0f0');
    gradient.addColorStop(0.5,'#ff0');
    gradient.addColorStop(0,'#f00');
//    ctx.clearRect(0, 0, cwidth, cheight);
    var draw = function(){
        //Copies the current frequency data into a Uint8Array (unsigned byte array) passed into it
        analyser.getByteFrequencyData(arr);
        ctx.clearRect(0,0,cwidth,cheight);
        //console.log('min:'+analyser.minDecibels+';max:'+analyser.maxDecibels);
        // console.log(arr);
        // console.log(analyser.frequencyBinCount);
        // console.log(analyser.fftsize);

        // flag++;
        // if(flag == 50)return;

        //判断不为空
        if(parseInt([].join.call(arr,''))){
            //每竖条填充绘图
            for(var i = 0;i < meterN;i++){
            	value = arr[i*step];
            	//绘制帽头
            	ctx.fillStyle = capStyle;
            	//初次推入数据
            	if(capPosition[i]){
            		capPosition.push(value);
            	};
            	//帽头缓降
            	if(capPosition[i] >= value){
            		capPosition[i]--;
            		ctx.fillRect(i*12,cheight - capPosition[i],meterWidth,capHeight);
            	//帽头陡升	
            	}else{
            		ctx.fillRect(i*12,cheight - value,meterWidth,capHeight);
            		capPosition[i] = value;
            	}
            	//绘制能量条
    			ctx.fillStyle = gradient;
                ctx.fillRect(i*12,cheight - value + capHeight,meterWidth,cheight);
//            console.log(arr[i]);
            }
            tStart = new Date();
        //播放完毕后退出
        }else{
            tEnd = new Date();
            if(((tEnd - tStart)/1000) > 5){
                return;
            }
        }
        //console.log(1);
        //自动更新画面
        requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
    //draw();
}





