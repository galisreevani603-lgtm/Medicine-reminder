import 'dotenv/config';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Medicine from './models/Medicine.js';
import Schedule from './models/Schedule.js';
import DoseLog from './models/DoseLog.js';

await connectDB();
await Promise.all([User.deleteMany({}), Medicine.deleteMany({}), Schedule.deleteMany({}), DoseLog.deleteMany({})]);
const [admin, doctor1, doctor2, patient1, patient2, patient3, caregiver] = await User.create([
  { name:'System Administrator', email:'admin@meditrack.test', password:'Admin123!', role:'ADMIN', approved:true },
  { name:'Dr. Maya Rao', email:'maya@meditrack.test', password:'Doctor123!', role:'DOCTOR', approved:true },
  { name:'Dr. Arjun Sen', email:'arjun@meditrack.test', password:'Doctor123!', role:'DOCTOR', approved:true },
  { name:'Asha Patel', email:'asha@meditrack.test', password:'Patient123!', role:'PATIENT', approved:true },
  { name:'Ravi Kumar', email:'ravi@meditrack.test', password:'Patient123!', role:'PATIENT', approved:true },
  { name:'Meera Iyer', email:'meera@meditrack.test', password:'Patient123!', role:'PATIENT', approved:true },
  { name:'Kiran Patel', email:'kiran@meditrack.test', password:'Caregiver123!', role:'CAREGIVER', approved:true }
]);
patient1.linkedDoctor=doctor1.id; patient2.linkedDoctor=doctor1.id; patient3.linkedDoctor=doctor2.id; caregiver.linkedPatient=patient1.id;
await Promise.all([patient1.save(),patient2.save(),patient3.save(),caregiver.save()]);
const names = ['Metformin','Amlodipine','Atorvastatin','Vitamin D3','Paracetamol','Omeprazole','Losartan','Aspirin','Cetirizine','Levothyroxine','Amoxicillin','Ibuprofen','Calcium','Pantoprazole','Glimepiride','Montelukast'];
await Medicine.insertMany(names.map((medicineName,i)=>({medicineName, genericName:medicineName.toLowerCase(), form:i===4?'syrup':'tablet', strength:`${i%2?10:500} mg`, createdBy:admin.id})));
const startDate = new Date(); startDate.setDate(startDate.getDate()-14); startDate.setHours(0,0,0,0);
const templates = [
  ['Metformin','500 mg',['08:00','20:00'],'After food',60],['Amlodipine','5 mg',['08:00'],'With water',20],['Vitamin D3','1000 IU',['13:00'],'After lunch',28],['Atorvastatin','10 mg',['21:00'],'At bedtime',20],['Omeprazole','20 mg',['07:00'],'Before breakfast',15],['Losartan','50 mg',['09:00'],'With water',30]
];
const schedules = await Schedule.insertMany(templates.map(([medicineName,dosage,times,instructions,stock],i)=>({ medicineName,dosage,times,instructions,stock,patient:i<3?patient1.id:patient2.id,prescribedBy:i<3?doctor1.id:doctor2.id,startDate,form:'tablet',frequency:'daily',quantityPerDose:1,color:['#ffb400','#00bcd4','#2ecc71'][i%3],status:'active' })));
const logs=[]; const today=new Date();
for (let days=7;days>=0;days--) for (const schedule of schedules) for(const time of schedule.times){const [h,m]=time.split(':').map(Number);const scheduledTime=new Date(today);scheduledTime.setDate(today.getDate()-days);scheduledTime.setHours(h,m,0,0);const isPast=scheduledTime<new Date();logs.push({patient:schedule.patient,schedule:schedule.id,medicineName:schedule.medicineName,scheduledTime,status:isPast?(Math.random()>.14?'taken':'missed'):'pending',takenTime:isPast?new Date(scheduledTime.getTime()+Math.random()*25*60000):undefined});}
await DoseLog.insertMany(logs);
console.log('Seed complete. Demo accounts: admin@meditrack.test, maya@meditrack.test, asha@meditrack.test, kiran@meditrack.test (see README for passwords).');
process.exit(0);
