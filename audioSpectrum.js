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
        audioContext.decodeAudioData(fileResult,
            function(buffer){
//                alert('analyze');
//                console.log(buffer);
                speAnalyze(buffer);
        },
        function(e){
            alert('解码失败');
        })
    };
    fr.readAsArrayBuffer(file);
}

function speAnalyze(buffer){
    var audioBufferSourceNode = audioContext.createBufferSource();
    var analyser = audioContext.createAnalyser();
    audioBufferSourceNode.connect(analyser);
    analyser.connect(audioContext.destination);
    audioBufferSourceNode.buffer = buffer;
    audioBufferSourceNode.start(0);
    speDraw(analyser);
}

function speDraw(analyser){
    var cwidth = speCan.width,
        cheight = speCan.height- 2,
        tStart,tEnd,
        ctx = speCan.getContext('2d'),
        gradient = ctx.createLinearGradient(0,0,0,300);
    gradient.addColorStop(1,'#0f0');
    gradient.addColorStop(0.5,'#ff0');
    gradient.addColorStop(0,'#f00');
    ctx.fillStyle = gradient;
//    ctx.clearRect(0, 0, cwidth, cheight);
    var draw = function(){
        var arr = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(arr);
        ctx.clearRect(0,0,cwidth,cheight);
        if(parseInt([].join.call(arr,''))){
            for(var i = 0;i < arr.length;i++){
                ctx.fillRect(i,cheight - arr[i],1,cheight);
//            console.log(arr[i]);
            }
            tStart = new Date();
        }else{
            tEnd = new Date();
            if(((tEnd - tStart)/1000) > 5){
                return;
            }
        }
        console.log(1);
        requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
}