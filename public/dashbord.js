
var form=document.getElementById("formId");
let element = document.getElementById("lodingMassage");
element.innerHTML='The man who mistook his wife for a hat';

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("./models"),
  faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
]).then(element.classList.add("hide"));


  //debugger;
let detectionDataToSend = []


async function submitForm(event){
  //Preventing page refresh
  event.preventDefault();
 await gatingLabels();
// fetchRequestForDetection()

}

//Calling a function during form submission.
form.addEventListener('submit', submitForm);


async function fetchRequestForDetection(){
  console.log("Hello");
  let formData = new FormData(form);
  const data = {year: formData.get("year"), branch: formData.get("branch"), class: formData.get("class"), detection: detectionDataToSend};

fetch("http://localhost:3000/detection", {
  method: "POST", // or 'PUT'
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
})
  .then((response) => response.json())
  .then((data) => {
    console.log("Success:", data);
  })
  .catch((error) => {
    console.error("Error:", error);
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
   await thisCanRetriveImages(data)
    // console.log(loadLabeledImages(data)._descriptors);
  //  console.log(detectionDataToSend);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
}

// _descriptors
async function thisCanRetriveImages(data){
   await loadLabeledImages(data)
//   detectionDataToNotSend.forEach(async function(det){
//   detectionDataToSend.push ( {label:det._label , descriptors: (det._descriptors)})
//  })
 console.log(detectionDataToSend);
 fetchRequestForDetection();
}


  function loadLabeledImages(labels) {
  
    return Promise.all(
      labels.map(async (label) => {
          const descriptions = [];
          for (let i = 1; i <= 10; i++) {
            const img = await faceapi.fetchImage(
              `https://raw.githubusercontent.com/Naman503/Minor-Project/advance/labeled_images/${label}/${i}.jpg`
            );
            const detections = await faceapi
              .detectSingleFace(img)
              .withFaceLandmarks()
              .withFaceDescriptor();
            descriptions.push(detections.descriptor);
          }
        let stringobj =  stringifyForEveryThing(descriptions)
        detectionDataToSend.push ({label:label , descriptors: stringobj})
        console.log(label);
        return new faceapi.LabeledFaceDescriptors(label, descriptions );
      })
    );
  }
  
const FLAG_TYPED_ARRAY = "FLAG_TYPED_ARRAY";

function stringifyForEveryThing(descriptions){
  var jsonStr = JSON.stringify(descriptions, function (key, value) {
    // the replacer function is looking for some typed arrays.
    // If found, it replaces it by a trio
    if (
      value instanceof Int8Array ||
      value instanceof Uint8Array ||
      value instanceof Uint8ClampedArray ||
      value instanceof Int16Array ||
      value instanceof Uint16Array ||
      value instanceof Int32Array ||
      value instanceof Uint32Array ||
      value instanceof Float32Array ||
      value instanceof Float64Array
    ) {
      var replacement = {
        constructor: value.constructor.name,
        data: Array.apply([], value),
        flag: FLAG_TYPED_ARRAY,
      };
      return replacement;
    }
    return value;
  });
  return jsonStr;
}

function unDoStringify(retrivedObj){
  let decodedJson = JSON.parse(retrivedObj, function (key, value) {
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
  return decodedJson;
}