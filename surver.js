const express = require("express");
const path = require("path")
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const cors = require('cors');
const ejs = require('ejs');
const app=express();
const faceapi = require('face-api.js');
const tenserflow = require('@tensorflow/tfjs-node');
const { string } = require("@tensorflow/tfjs-node");
// const reader = new FileReader();

app.use(express.json())
app.use(cors());
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');
// router.use(bodyParser.json());

app.use(express.static("public"));
mongoose.set('strictQuery', false);
main().catch(err => console.log(err));

async function loadModules(){
 await faceapi.nets.ssdMobilenetv1.loadFromDisk("./models");
 await faceapi.nets.tinyFaceDetector.loadFromDisk("./models");
 await faceapi.nets.faceLandmark68Net.loadFromDisk("./models");
 await faceapi.nets.faceRecognitionNet.loadFromDisk("./models");
//  await faceapi.nets.faceExpressionNet.loadFromDisk("./models");

}
loadModules();

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/Attendance_for_hack');
  
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

const detectionSchema = new mongoose.Schema({
    college: String,
    branch: String,
    year: Number,
    class: Number,
    detection: []
  });

const mongoDetection = mongoose.model('detections', detectionSchema);

const attendanceSchema = new mongoose.Schema({
  college: String,
  branch: String,
  year: Number,
  class: Number,
  subject: String,
  sem: Number,
  date: String,
  dateYear:Number,
  dateMonth:Number,
  dateDate:Number,
  attendance: []
});

const mongoAttendance = mongoose.model('attendances', attendanceSchema);

app.get("/",function(req,res){
  res.render("index");
})

app.get("/home",function(req,res){
  res.render("home");
})

app.get("/admin",function(req,res){
  res.render("dashbord");
})

app.get("/teacherDashbord",async function(req,res){
  let totalAttendance = 0;
  let totalAttendancePerDay=0;
  let resultList=[];
  let noOfDetection = 0;
  mongoDetection.find({},function(err,result){
    if(err){
      console.log(err);
    }
    else{
     result.forEach(function(obj){
      noOfDetection += obj.detection.length;
     })
    }
  })
  mongoAttendance.find({},function(err,result){
    if(err){
      console.log(err);
    }
    else{
      // console.log(result)
      totalAttendance += result.length;
      result.forEach(element =>{
        if( element.date == nowTodaysDate){
          totalAttendancePerDay += 1;
        }
        if(element.dateYear == date_ob.getFullYear() && element.dateMonth== date_ob.getMonth() ){
          resultList.push(element); 
        }
      })
    }
    res.render("teacherDashbord",{result:resultList, totalAttendance:totalAttendance, totalAttendancePerDay:totalAttendancePerDay, noOfDetection: noOfDetection});
    console.log(totalAttendance)
  })
})

app.post("/detection", function(req,res){
    mongoDetection.find({},function(err,result){
      if(err){
        console.log(err);
      }
      else{
        if(result.length == 0){
          let newStudentDetection = new mongoDetection({
            college : "IIST",
            branch : "CS",
            year : 3,
            class : 2,
            detection : [{label:"Naman Pathak"}]
          })
          newStudentDetection.save()
        }
      }
    })
  //  let newStudentDetection = new mongoDetection({
  //   college : "IIST",
  //   branch : req.body.branch,
  //   year : req.body.year,
  //   class : req.body.class,
  //   detection : [{a:"hello", b:1}, {a:"hello", b:2},{a:"hello", b:3}]
  //  })
  //  newStudentDetection.save()

  mongoDetection.findOneAndUpdate({year:req.body.year, branch:req.body.branch, class:req.body.class},{$set:{detection: req.body.detection}},function(err){
    console.log(err)
})
    console.log(req.body.detection);
    res.render("dashbord");
  })


  app.post("/lableForDetection", function(req,res){
    let labelsToSend = [];
    mongoDetection.findOne({year:req.body.year, branch:req.body.branch, class:req.body.class},function(err,result){
      if(err){
        console.log(err);
      }
      else{
        (result.detection).forEach(element => {
          labelsToSend.push(element.label)
        });
        console.log(labelsToSend)
        res.send(labelsToSend);
      }
  })
})

app.post("/index/retriveDetectionData",function(req,res){
  mongoDetection.findOne({year:req.body.year, branch:req.body.branch, class:req.body.class},function(err,result){
    if(err){
      console.log(err);
    }
    else{
      res.send(result.detection);
    }
})
})
const subject = [
  {college:"IIST", year:3, branch:"CS", sem:6, subjects:["Machine Learning", "Computer Networks", "Compiler Design", "Data Analytics Lab", " Project Management", "Skill Development Lab"]}
]
app.post("/index/subjectData",function(req,res){
  subject.forEach(function(fields){
    if(fields.college == "IIST" && fields.year== req.body.year && fields.branch== req.body.branch && fields.sem== req.body.sem){
      res.send(fields.subjects);
    }
  })
})

let date_ob = new Date();
let date = ("0" + date_ob.getDate()).slice(-2);
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
let year = date_ob.getFullYear();
let nowTodaysDate = year + "-" + month + "-" + date;
  app.post("/endSession", function(req,res){
    let newStudentAttendance = new mongoAttendance({
     college : "IIST",
     branch : req.body.branch,
     year : req.body.year,
     class : req.body.class,
     sem: req.body.sem,
     subject: req.body.subject,
     date:nowTodaysDate ,
     dateYear: date_ob.getFullYear(),
     dateMonth: date_ob.getMonth(),
     dateDate: date_ob.getDate(),
     attendance : req.body.attendance
    })
    newStudentAttendance.save()
     console.log(req.body)
     res.render("index");
   })


  // function loadLabeledImages() {
  //   const labels = ["Naman Pathak"];
  
  //   return Promise.all(
  //     labels.map(async (label) => {
  //         const descriptions = [];
  //         for (let i = 1; i <= 2; i++) {
  //           const img = await faceapi.fetchImage(
  //             `https://raw.githubusercontent.com/Naman503/Minor-Project/advance/labeled_images/${label}/${i}.jpg`
  //           );
  //           const detections = await faceapi
  //             .detectSingleFace(img)
  //             .withFaceLandmarks()
  //             .withFaceDescriptor();
  //           descriptions.push(detections.descriptor);
  //         }
  //       let stringobj =  stringifyForEveryThing(descriptions)
  //       console.log(label);
  //       return {label, stringobj };
  //     })
  //   );
  // }
  
  

// function stringifyForEveryThing(descriptions){
//   let jsonStr = JSON.stringify(descriptions, function (key, value) {
//     // the replacer function is looking for some typed arrays.
//     // If found, it replaces it by a trio
//     if (
//       value instanceof Int8Array ||
//       value instanceof Uint8Array ||
//       value instanceof Uint8ClampedArray ||
//       value instanceof Int16Array ||
//       value instanceof Uint16Array ||
//       value instanceof Int32Array ||
//       value instanceof Uint32Array ||
//       value instanceof Float32Array ||
//       value instanceof Float64Array
//     ) {
//       var replacement = {
//         constructor: value.constructor.name,
//         data: Array.apply([], value),
//         flag: FLAG_TYPED_ARRAY,
//       };
//       return replacement;
//     }
//     return value;
//   });

//   return jsonStr;
  
// }

// function unDoStringify(retrivedObj){
//   let decodedJson = JSON.parse(retrivedObj, function (key, value) {
//     // the reviver function looks for the typed array flag
//     try {
//       if ("flag" in value && value.flag === FLAG_TYPED_ARRAY) {
//         // if found, we convert it back to a typed array
//         return new context[value.constructor](value.data);
//       }
//     } catch (e) {}

//     // if flag not found no conversion is done
//     return value;
//   });
//   return decodedJson;
// }


  

  app.listen(3000,function(){
    console.log("server started on port 3000");
});
