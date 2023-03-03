
var form=document.getElementById("formId");
var dropdown = document.getElementById("dropdown");

const video = document.getElementById("video");
const stopVideo = document.getElementById("stopVideo");
const videoButton = document.getElementById("videoButton");
const uplodeImage = document.getElementById("uplodeImage");
const pauseVideo = document.getElementById("pauseVideo");
const takeImages = document.getElementById("TakeImage");
const TakePhotoBtn = document.getElementById("TakePhoto");
const startSession = document.getElementById("startSession");
const endSession = document.getElementById("endSession");


const imageUploadActionFrame = document.getElementById("imageUpload");

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("./models"),
  faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
  faceapi.nets.faceExpressionNet.loadFromUri("./models"),
]).then(enableAllButton());

// <--- Form Work  --->
let labelsForClassDetections = [];
async function submitForm(event){
  //Preventing page refresh
  event.preventDefault();
 await fetchRequestForSubjects();
await  gatingLabels();
await fetchRequestForDetection()

}

//Calling a function during form submission.
form.addEventListener('submit', submitForm);

async function fetchRequestForDetection(){
  console.log("Hello");
  let formData = new FormData(form);
  const data = {year: formData.get("year"), branch: formData.get("branch"), class: formData.get("class")};

fetch("http://localhost:3000/index/retriveDetectionData", {
  method: "POST", // or 'PUT'
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
})
  .then((response) => response.json())
  .then((data) => {
    // console.log("Success:", data);
    data.forEach(function(d){
      localStorage.setItem("backendData" + d.label, d.descriptors);
    })
  })
  .catch((error) => {
    console.error("Error:", error);
  });
}

async function fetchRequestForSubjects(){
  console.log("Hello");
  let formData = new FormData(form);
  const data = {year: formData.get("year"), branch: formData.get("branch"), class: formData.get("class"), sem: formData.get("sem")};

fetch("http://localhost:3000/index/subjectData",  {
  method: "POST", // or 'PUT'
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
})
  .then(response => response.json()) // Convert response to JSON
  .then(data => {
    // Get the select element
 
    // Loop through the data array
    for (var i = 0; i < data.length; i++) {
      // Create a new option element
      var option = document.createElement("option");
      // Set the value and text of the option element
      option.value = data[i];
      option.text = data[i];
      // Append the option element to the select element
      dropdown.appendChild(option);
      dropdown.classList.remove("hide");
      var submitForDetection = document.getElementById("submitForDetection");
      submitForDetection.classList.add("hide");
    }
  })
  .catch(error => console.error(error)); 
}

// <--- here Start Work of API --->

function enableAllButton() {
  document.querySelector(".loadingMassage").classList.add("hide");
  TakePhotoBtn.classList.add("hide");
  videoButton.classList.remove("hide");
  uplodeImage.classList.remove("hide");
  takeImages.classList.remove("hide");
}
videoButton.addEventListener("click", function () {
  uplodeImage.classList.add("hide");
  stopVideo.classList.remove("hide");
  pauseVideo.classList.remove("hide");
  takeImages.classList.add("hide");
  video.classList.remove("hide");
  startVideo();
  startSession.classList.remove("hide");
  videoButton.classList.add("desible");
});
stopVideo.addEventListener("click", function () {
  video.srcObject = stop();
});
pauseVideo.addEventListener("click", function () {
  if (pauseVideo.innerHTML == "Pause Video") {
    video.pause();
    pauseVideo.innerHTML = "Play Video";
  } else {
    video.play();
    pauseVideo.innerHTML = "Pause Video";
  }
});
uplodeImage.addEventListener("click", function () {
  videoButton.classList.add("hide");
  takeImages.classList.add("hide");
  video.srcObject = stop();
  video.classList.add("hide");
  document.querySelector(".loadingMassage").classList.remove("hide");
  start();
  startSession.classList.remove("hide");
  uplodeImage.classList.add("desible");
});
takeImages.addEventListener("click",function(){
  videoButton.classList.add("hide");
  video.srcObject = stop();
  video.classList.add("hide");
  document.querySelector(".loadingMassage").classList.remove("hide");
  TakePhoto();
  startSession.classList.remove("hide");
  takeImages.classList.add("desible");
})
let isSessionStarted = false;

startSession.addEventListener("click",function(){
  endSession.classList.remove("hide");
   isSessionStarted = true;
  startSession.classList.add("hide");
})

let attendanceArray = new Array();

endSession.addEventListener("click",function(){
  endSession.classList.add("hide");
   isSessionStarted = false;
  // startSession.classList.add("hide");
  
    let formData = new FormData(form);
  // console.log(formData.get("subject"));
  const data = {year: formData.get("year"), branch: formData.get("branch"), class: formData.get("class"), sem: formData.get("sem"), subject:formData.get("subject"), attendance:attendanceArray};

  fetch("http://localhost:3000/endSession", {
  method: "POST", // or 'PUT'
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
})
  .then((response) => response.json())
  .then((data) => {
    console.log("Success:", data);
    endSession.classList.add("hide");
  })
  .catch((error) => {
    console.error("Error:", error);
  });
})

async function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    video.srcObject = stream;
    (err) => console.error(err);
    setTimeout(function () {
      video.play();
    }, 100);
  });
}

video.addEventListener("play", async () => {
  document.querySelector(".loadingMassage").classList.remove("hide");
  const labeledFaceDescriptors = await loadLabeledImages();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.47);
  document.querySelector(".loadingMassage").classList.add("hide");

  const containerDiv = document.querySelector(".videoDiv");
  console.log("await");
  const canvas = faceapi.createCanvasFromMedia(video);
  canvas.classList.add("canvasVideo");
  containerDiv.append(canvas);

  const displaySizeVideo = { width: video.width, height: video.height };

  faceapi.matchDimensions(canvas, displaySizeVideo);



  const attendanceDiv = document.createElement("div");
  attendanceDiv.style.position = "absolute";
  attendanceDiv.classList.add("attendanceDiv");
  document.body.append(attendanceDiv);

  const attendanceDivItem = document.querySelector(".attendanceDiv");

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors();


    const resizedDetections = faceapi.resizeResults(
      detections,
      displaySizeVideo
    );

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    faceapi.draw.drawDetections(canvas, resizedDetections);

let totalDetection = 0;
totalDetection++;
    const results = resizedDetections.map((d) =>
      faceMatcher.findBestMatch(d.descriptor)
    );
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result.toString(),
      });
      let consern = 0;
      for (let i = 0; i < attendanceArray.length; i++) {
        if (result._label == attendanceArray[i]) {
          consern = 1;
        }
      }
      if (consern != 1 && result._label != "unknown" && isSessionStarted) {
        attendanceArray.push(result._label);
      }
      drawBox.draw(canvas);
    });

    attendanceDivItem.innerHTML =
      "<div class='attendanceFirst'> " +
      attendanceArray.length
      +
      " Total<br></div><ol type='1'>";
    for (let i = 0; i < attendanceArray.length; i++) {
      if (attendanceArray[i] != "unknown") {
        attendanceDivItem.innerHTML =
          attendanceDivItem.innerHTML + "<li>" + attendanceArray[i] + "</li>";
      }
    }
    attendanceDivItem.innerHTML = attendanceDivItem.innerHTML + "</ol>";
  }, 500);
});

// Image uploding section

// get the glogal context for compatibility with node and browser
var context = typeof window === "undefined" ? global : window;

// flag that will be sliped in the json string
const FLAG_TYPED_ARRAY = "FLAG_TYPED_ARRAY";









async function TakePhoto(){
  await faceapi.nets.ssdMobilenetv1.loadFromUri("./models");
  TakePhotoBtn.classList.remove("hide");

  const webcamElement = document.getElementById('webcam');
  const canvasElement = document.getElementById('canvas');
  const snapSoundElement = document.getElementById('snapSound');
  const webcam = new Webcam(webcamElement, 'Environment', canvasElement, snapSoundElement);

  const container = document.createElement("div");
  container.classList.add("resultImgPosition");
  document.body.append(container);

  webcam.start()
  .then(result =>{
     console.log("webcam started");
    //  document.querySelector(".loadingMassage").classList.add("hide");
  })
  .catch(err => {
      console.log(err);
  });
  const labeledFaceDescriptors = await loadLabeledImages();

  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.56);


  let image;
  let canvas;
  document.querySelector(".loadingMassage").classList.add("hide");
  // let attendanceArray = new Array();
  let time=0;
  TakePhotoBtn.addEventListener("click",async function(){
    if(time===0){  
      document.querySelector(".loadingMassage").classList.remove("hide");
      time++;
      console.log(time);
    }
    if (image) image.remove();
    if(canvas) canvas.remove();
    console.log("snap");
    
    
    let picture = webcam.snap();
    document.getElementById('result').innerHTML = 
    '<img id="snap" class="resultImgPosition" src="'+picture+'"/>';
    console.log("hello1");
    image = await document.getElementById('snap');
    canvas = faceapi.createCanvasFromMedia(image);
    container.append(canvas);

    
    const displaySize = { width: image.width, height: image.height };
    faceapi.matchDimensions(canvas, displaySize);
    const detections = await faceapi
    .detectAllFaces(image)
    .withFaceLandmarks()
    .withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const results = resizedDetections.map((d) =>
    faceMatcher.findBestMatch(d.descriptor)
    );
    console.log("hello2");
    document.querySelector(".loadingMassage").classList.add("hide");
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result.toString(),
      });
      let repert=0;
      for(let j=0;j<attendanceArray.length;j++){

        if(attendanceArray[j]==result._label){
          repert=1;
        }
      
      }
      if(repert===0 && isSessionStarted == true && result._label != "unknown"){
        attendanceArray.push(result._label);
      }
      drawBox.draw(canvas);
    });
    const attendanceDiv = document.createElement("div");
    attendanceDiv.style.position = "absolute";
    attendanceDiv.classList.add("attendanceDiv");
    document.body.append(attendanceDiv);

    const attendanceDivItem = document.querySelector(".attendanceDiv");
    let present = 0;
    attendanceDivItem.innerHTML =
      "<div class='attendanceFirst'> " +
      attendanceArray.length +
      " Total<br></div><ol type='1'>";
    for (let i = 0; i < attendanceArray.length; i++) {
      if (attendanceArray[i] != "unknown") {
        present += 1;
        attendanceDivItem.innerHTML =
          attendanceDivItem.innerHTML + "<li>" + attendanceArray[i] + "</li>";
      } else {
        unknown += 1;
      }
    }
    attendanceDivItem.innerHTML = attendanceDivItem.innerHTML + "</ol>";
    document.querySelector(".attendanceFirst").innerHTML +=
    attendanceArray.length-present  + " Unknown<br>" + present + " Present <br>";
  
  })

}



 



// <---- UPLODE Image --->


async function start() {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.classList.add("imagePosition");
  document.body.append(container);
  
  
  let labeledFaceDescriptors = await loadLabeledImages();
  
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.56);
  let image;
  let canvas;
  
  document.querySelector(".loadingMassage").classList.add("hide");
  imageUploadActionFrame.classList.remove("hide");
  imageUpload.addEventListener("change", async () => {
    // let attendanceArray = new Array();
    if (image) image.remove();
    if (canvas) canvas.remove();
    image = await faceapi.bufferToImage(imageUpload.files[0]);
    // image = await faceapi.bufferToImage(picture);


    container.append(image);
    canvas = faceapi.createCanvasFromMedia(image);
    canvas.classList.remove("canvasVideo");
    container.append(canvas);

    image.classList.add("imagePosition");


    const displaySize = { width: image.width, height: image.height };
    faceapi.matchDimensions(canvas, displaySize);
    const detections = await faceapi
      .detectAllFaces(image)
      .withFaceLandmarks()
      .withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    let totalDetection = 0;
    const results = resizedDetections.map((d) =>
    faceMatcher.findBestMatch(d.descriptor)
    );
    results.forEach((result, i) => {
      totalDetection++;
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result.toString(),
      });
      let consern = 0;
      for (let i = 0; i < attendanceArray.length; i++) {
        if (result._label == attendanceArray[i]) {
          consern = 1;
        }
      }
      if (consern == 0 && isSessionStarted== true && result._label != "unknown"){
        attendanceArray.push(result._label);
      }
      drawBox.draw(canvas);
    });
    const attendanceDiv = document.createElement("div");
    attendanceDiv.style.position = "absolute";
    attendanceDiv.classList.add("attendanceDiv");
    document.body.append(attendanceDiv);

    const attendanceDivItem = document.querySelector(".attendanceDiv");
    let present = 0;
    attendanceDivItem.innerHTML =
      "<div class='attendanceFirst'> " +
      totalDetection +
      " Total<br></div><ol type='1'>";
    for (let i = 0; i < attendanceArray.length; i++) {
      if (attendanceArray[i] != "unknown") {
        present += 1;
        attendanceDivItem.innerHTML =
          attendanceDivItem.innerHTML + "<li>" + attendanceArray[i] + "</li>";
      }
    }
    attendanceDivItem.innerHTML = attendanceDivItem.innerHTML + "</ol>";
    document.querySelector(".attendanceFirst").innerHTML +=
      attendanceArray.length-present + " Unknown<br>" + present + " Present <br>";
  });
}





async function gatingLabels(){
  let formData = new FormData(form);
const data = { year: formData.get("year"), branch: formData.get("branch"), class:formData.get("class")  };

await fetch("http://localhost:3000/lableForDetection", {
method: "POST", // or 'PUT'
headers: {
  "Content-Type": "application/json",
},
body: JSON.stringify(data),
})
.then((response) => response.json())
.then(async (data) => {
  console.log("Success:", data);
  labelsForClassDetections = data;
})
.catch((error) => {
  console.error("Error:", error);
});
}

// Take Photo




function loadLabeledImages() {
  const labels = labelsForClassDetections;

  return Promise.all(
    labels.map(async (label) => {

      var retrivedObj = localStorage.getItem("backendData" + label);
      
      var decodedJson = JSON.parse(retrivedObj, function (key, value) {
        // the reviver function looks for the typed array flag
        try {
          if ("flag" in value && value.flag === FLAG_TYPED_ARRAY) {
            // if found, we convert it back to a typed array
            return new context[value.constructor](value.data);
          }
        } catch (e) {}
        
        // if flag not found no conversion is done
        return value;
      });
      console.log(decodedJson);
      console.log(label);
      return new faceapi.LabeledFaceDescriptors(label, decodedJson);
    })
  );
}

