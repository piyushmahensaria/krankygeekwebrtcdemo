navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
var localStream;
var localVideo;
var remoteVideo;
var peerConnection;
var iamcaller = false;
peerConnectionConfig = {iceServers: [
        {urls: "stun:23.21.150.121"},
        {urls: "stun:stun.l.google.com:19302"},
        {urls: "turn:numb.viagenie.ca", credential: "webrtcdemo", username: "louis%40mozilla.com"}
    ]}

    
call = function(){
	iamcaller = true;
	start(true);
}
Streamy.on("", function(message) {
  		gotMessageFromServer(message);
	});

Template.webrtc.onRendered(function(){

    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');


    var constraints = {
        video: true,
        audio: false,
    };

    if(navigator.getUserMedia) {
        navigator.getUserMedia(constraints, getUserMediaSuccess, getUserMediaError);
    } else {
        alert('Your browser does not support getUserMedia API');
    }
})

function getUserMediaSuccess(stream) {
	localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');
    localStream = stream;
    localVideo.src = window.URL.createObjectURL(stream);
}

function getUserMediaError(error) {
    console.log(error);
}

function start(isCaller) {
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;
    peerConnection.onaddstream = gotRemoteStream;
    peerConnection.addStream(localStream);
    console.log(peerConnection)
    if(isCaller) {
        peerConnection.createOffer(gotDescription, createOfferError);
    }
}

function gotDescription(description) {
    peerConnection.setLocalDescription(description, function () {
    	if(iamcaller === true)
        	Streamy.emit('msg',{'sdp': description,caller:true} );
    	else
    		Streamy.emit('msg',{'sdp': description,caller:false} );
    }, function() {console.log('set description error')});
}

function gotIceCandidate(event) {
    if(event.candidate != null) {
    	if(iamcaller === true)
        	Streamy.emit('msg',{'ice': event.candidate, caller:true});
        else
        	Streamy.emit('msg',{'ice': event.candidate, caller:false});
    }
}

function gotRemoteStream(event) {
	remoteVideo = document.getElementById('remoteVideo');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}

function createOfferError(error) {
    console.log(error);
}
function createAnswerError(error) {
    console.log(error);
}
function errorHandler(error) {
    console.log(error);
}
function gotMessageFromServer(message) {
	if( (iamcaller === true && message.caller === false ) || ( iamcaller === false && message.caller === true ) ){
    if(peerConnection === undefined ) start(false);
    var signal = message;
    if(signal.sdp) {
    	 peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp), function() {
    	 	if(!iamcaller)
            peerConnection.createAnswer(gotDescription, errorHandler);
        }, errorHandler);
    } else if(signal.ice) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
    }
}
}