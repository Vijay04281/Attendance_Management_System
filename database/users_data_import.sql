USE attendance_management;
-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: attendance_management
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (1,4,1,'2026-09-11 17:12:23',''),(2,4,2,'2026-09-11 17:12:23',''),(3,5,1,'2026-09-11 17:44:49',''),(4,5,2,'2026-09-11 17:44:49',''),(5,6,1,'2026-09-11 18:24:49',''),(6,6,2,'2026-09-11 18:24:49','');
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `attendance_records`
--

LOCK TABLES `attendance_records` WRITE;
/*!40000 ALTER TABLE `attendance_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `attendance_reports`
--

LOCK TABLES `attendance_reports` WRITE;
/*!40000 ALTER TABLE `attendance_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `attendance_sessions`
--

LOCK TABLES `attendance_sessions` WRITE;
/*!40000 ALTER TABLE `attendance_sessions` DISABLE KEYS */;
INSERT INTO `attendance_sessions` VALUES (1,1,1,NULL,NULL,NULL,'2026-09-09','10:00:00','22:30:02','612475e1-faa7-4744-8592-fc260dcafbb4','2026-09-10 22:30:02','CLOSED','2026-09-09 14:44:04'),(2,1,1,NULL,NULL,NULL,'2026-09-10','22:30:08','22:30:42','3d7e32a6-9b75-44b4-a0e6-09e78a07ea21','2026-09-10 22:30:42','CLOSED','2026-09-10 17:00:08'),(3,1,1,NULL,NULL,NULL,'2026-09-11','19:37:02','19:37:32','0f3c4b27-b005-40fc-869a-8ebad1f56289','2026-09-11 19:37:32','CLOSED','2026-09-11 14:07:02'),(4,1,1,NULL,NULL,NULL,'2026-09-11','21:16:13','22:42:23','fbb2de3d34c29a5fdcaaf51960442008b5b1f8978792397161927d10b36744a8','2026-09-11 22:42:23','CLOSED','2026-09-11 15:46:13'),(5,1,1,NULL,NULL,NULL,'2026-09-11','22:42:28','23:14:49','cd89028b558f7fd7504fa2878f1c4e89b7cfa743e725807df16e4edf9988ca2a','2026-09-11 23:14:49','CLOSED','2026-09-11 17:12:28'),(6,1,1,NULL,NULL,NULL,'2026-09-11','23:54:41','23:54:49','cc7b4543b3330f97db11899ccc7f998aaf9384a234cc6374970fb1cfeef35275','2026-09-11 23:54:49','CLOSED','2026-09-11 18:24:41'),(7,3,7,1,2,'2026-2027','2026-09-14','14:39:48','14:50:43','1b9c730ef39b1b6848cd9087a4fd4842723cda2a8861d06b79c2d72d2518a007','2026-09-14 09:14:48','CLOSED','2026-09-14 09:09:48'),(8,3,7,1,2,'2026-2027','2026-09-14','14:52:28','15:03:24','6c3d171e8ebbd4073ffeacb4b174b83473a15a7ae5657b11cc28a821586280eb','2026-09-14 09:27:28','CLOSED','2026-09-14 09:22:28'),(9,3,7,1,2,'2026-2027','2026-09-14','15:07:17','15:07:39','2499d1b83596507d982c8956ab87a1ded0355b0864023e0c333948604809b14a','2026-09-14 09:42:17','CLOSED','2026-09-14 09:37:17'),(10,3,7,1,2,'2026-2027','2026-09-14','15:14:56','15:15:36','b042ef7a82426f1df881ddbf38ca6a0160bbecd309157abfea19bb6f2290529a','2026-09-14 15:15:48','CLOSED','2026-09-14 09:44:56'),(11,3,7,1,2,'2026-2027','2026-09-14','16:14:33','16:14:44','0cfc8db453a6d7c373919299868fc0e8b16f31a53c6811cbad6d9181821cb0c1','2026-09-14 16:14:54','CLOSED','2026-09-14 10:44:33'),(12,3,7,1,2,'2026-2027','2026-09-14','16:14:54','16:15:01','2cf0d65bf0ae78df3fa13d6b6e09af86696834be787fdad3a717ab018770296f','2026-09-14 16:15:14','CLOSED','2026-09-14 10:44:54'),(13,6,8,3,2,'2026-2027','2026-09-14','16:57:04','16:57:12','55ff2f82047cc1e2f6d25b4d90dacfb9ee899f5239319b0d963b67f87af684ef','2026-09-14 16:57:23','CLOSED','2026-09-14 11:27:04'),(14,9,8,10,3,'2026-2027','2026-09-14','21:40:04','21:40:11','7a1da62149f40e88aef8a7b6bb5c5b44e28c3ef94aa7106219797ffea2d9d068','2026-09-14 21:40:22','CLOSED','2026-09-14 16:10:04');
/*!40000 ALTER TABLE `attendance_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `class_teacher_allocations`
--

LOCK TABLES `class_teacher_allocations` WRITE;
/*!40000 ALTER TABLE `class_teacher_allocations` DISABLE KEYS */;
/*!40000 ALTER TABLE `class_teacher_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `class_teacher_assignments`
--

LOCK TABLES `class_teacher_assignments` WRITE;
/*!40000 ALTER TABLE `class_teacher_assignments` DISABLE KEYS */;
INSERT INTO `class_teacher_assignments` VALUES (1,2,1,'2026-27','1','ACTIVE','2026-09-12 19:05:31'),(4,12,2,'2026-2027','4','ACTIVE','2026-09-14 05:45:39'),(5,19,3,'2026-2027','3','ACTIVE','2026-09-14 15:17:40');
/*!40000 ALTER TABLE `class_teacher_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `class_teachers`
--

LOCK TABLES `class_teachers` WRITE;
/*!40000 ALTER TABLE `class_teachers` DISABLE KEYS */;
INSERT INTO `class_teachers` VALUES (1,1,1,NULL,'ACTIVE');
/*!40000 ALTER TABLE `class_teachers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` VALUES (1,1,2,'A'),(2,2,2,'A'),(3,3,2,'A');
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Computer Science','CSE','2026-09-09 14:06:40'),(2,'Information Technology','2026IT','2026-09-13 19:20:59'),(3,'Electronics Communication Engineering','2026ECE','2026-09-14 04:01:12');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `qr_codes`
--

LOCK TABLES `qr_codes` WRITE;
/*!40000 ALTER TABLE `qr_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `qr_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (1,2,'STAFF001','Test Staff','staff001@example.com','Computer Science',NULL,'STAFF'),(3,5,'ST001','Kumar','kumar@gmail.com','Computer Science','9876543210','HOD'),(5,8,'2026ECE156','Manoj S','manoj012@gmail.com','Electronics Communication Engineering','9876543023','STAFF'),(6,12,'2026IT216','Class Teacher','classteacher012@gmail.com','Information Technology','8745634567','TEACHER'),(7,13,'2026IT544','Subject Staff','subject966@gmail.com','Information Technology','5798653457','STAFF'),(8,14,'2026ECE765','staff R','staff012@gmail.com','Electronics Communication Engineering','9876543023','STAFF'),(9,15,'2026IT368','Maths Teacher','maths012@gmail.com','Electronics Communication Engineering','7422863245','STAFF'),(10,16,'2026IT987','staff003','staff003@gmail.com','Information Technology','8521479624','STAFF'),(11,17,'2026ECE254','staff101','staff101@gmail.com','Computer Science','7423846759','STAFF'),(12,18,'2026IT897','staff004','staff004@gmail.com','Information Technology','9687453698','STAFF'),(13,19,'2026ECE576','ECE staff','staffece@gmail.com','Electronics Communication Engineering','8974568459','TEACHER'),(14,20,'2026ECE001','ECE hod','ecehod@gmail.com','Electronics Communication Engineering','7896847526','HOD');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `staff_subjects`
--

LOCK TABLES `staff_subjects` WRITE;
/*!40000 ALTER TABLE `staff_subjects` DISABLE KEYS */;
INSERT INTO `staff_subjects` VALUES (4,1,1,1),(5,1,2,1);
/*!40000 ALTER TABLE `staff_subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,3,'STU001','Arun Kumar','arun@example.com','Computer Science',2,'A'),(2,NULL,'STU002','Test Student','student@example.com','Computer Science',2,'A'),(5,NULL,'2503713020521058','Vijay P','71382506058.vijay@sritcbe.ac.in','Information Technology',2,'A'),(9,11,'2503713020521057','Venis Velan','71382506057.venis@sritcbe.ac.in','Information Technology',2,'A'),(10,21,'2503713020521014','Eswara Kumar D','71382506014.eswara@sritcbe.ac.in','Information Technology',2,'A'),(11,22,'2503713020521034','Pragathesh M','71382506034.pragathesh@sritcbe.ac.in','Information Technology',2,'A'),(12,23,'2503713020521001','Aadhithyan K','71382506001.aadhithyan@sritcbe.ac.in','Information Technology',2,'A'),(13,24,'2503713020521002','Agilan M','71382506002.agilan@sritcbe.ac.in','Information Technology',2,'A'),(14,25,'2503713810621029','ManojKrishna S','71382504029.manojkrishna@sritcbe.ac.in','Electronics Communication Engineering',2,'A'),(15,26,'2503713810621015','Gowtham M','71382504029.gowtham@sritcbe.ac.in','Electronics Communication Engineering',2,'A'),(16,27,'2503713810621014','Gowreeshwaran','71382504029.gowreeshwaran@sritcbe.ac.in','Electronics Communication Engineering',2,'A'),(17,28,'2503713810621025','Sabarivasan G','71382506014.sabarivasan@sritcbe.ac.in','Electronics Communication Engineering',2,'A');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `subject_allocations`
--

LOCK TABLES `subject_allocations` WRITE;
/*!40000 ALTER TABLE `subject_allocations` DISABLE KEYS */;
INSERT INTO `subject_allocations` VALUES (1,3,7,2,'2026-2027',NULL,NULL,4,'2026-09-14 05:53:10'),(2,5,5,2,'2026-2027',NULL,NULL,3,'2026-09-14 11:05:16'),(3,6,8,2,'2026-2027',NULL,NULL,3,'2026-09-14 11:05:40'),(4,7,5,3,'2026-2027',NULL,NULL,3,'2026-09-14 11:06:20'),(5,7,10,2,'2026-2027',NULL,NULL,3,'2026-09-14 14:42:22'),(6,1,12,2,'2026-2027',NULL,NULL,3,'2026-09-14 14:42:49'),(7,4,12,2,'2026-2027',NULL,NULL,3,'2026-09-14 14:43:26'),(8,2,11,2,'2026-2027',NULL,NULL,3,'2026-09-14 14:44:08'),(9,9,11,3,'2026-2027',NULL,NULL,3,'2026-09-14 15:18:08'),(10,9,8,3,'2026-2027',NULL,NULL,3,'2026-09-14 15:18:30'),(11,10,9,3,'2026-2027',NULL,NULL,3,'2026-09-14 15:19:08'),(12,11,12,3,'2026-2027',NULL,NULL,3,'2026-09-14 15:19:31'),(13,8,12,3,'2026-2027',NULL,NULL,3,'2026-09-14 15:19:49'),(14,11,12,1,'2026-2027',NULL,NULL,3,'2026-09-14 15:20:11'),(15,7,8,1,'2026-2027',NULL,NULL,3,'2026-09-14 15:20:32');
/*!40000 ALTER TABLE `subject_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `subject_assignments`
--

LOCK TABLES `subject_assignments` WRITE;
/*!40000 ALTER TABLE `subject_assignments` DISABLE KEYS */;
INSERT INTO `subject_assignments` VALUES (1,1,1,1);
/*!40000 ALTER TABLE `subject_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES (1,'CS101','Programming Fundamentals','3',2,3,4,'A',1),(2,'CS201','Data Structures','1',2,5,4,'A',1),(3,'25CS255','Database Management System','2',2,3,4,NULL,NULL),(4,'25IT205','Universal Acceptance','2',2,3,3,NULL,NULL),(5,'25IT208','Information Security','2',2,3,3,NULL,NULL),(6,'25IT252','Python','2',2,4,3,NULL,NULL),(7,'25CS254','Operating System','2',2,3,3,NULL,NULL),(8,'25EC206','Analog Electronic',NULL,2,4,3,NULL,NULL),(9,'25EC216','Electronic Standards','3',2,3,3,NULL,NULL),(10,'25MA252','Maths','3',2,3,3,NULL,NULL),(11,'25CS289','Computer Management','1',2,3,3,NULL,NULL);
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `timetables`
--

LOCK TABLES `timetables` WRITE;
/*!40000 ALTER TABLE `timetables` DISABLE KEYS */;
INSERT INTO `timetables` VALUES (1,1,1,1,'MONDAY','10:00:00','11:00:00'),(2,1,1,1,'FRIDAY','10:00:00','11:00:00'),(3,2,5,5,'MONDAY','08:55:00','10:30:00'),(4,2,2,11,'MONDAY','11:50:00','12:30:00'),(5,2,4,12,'MONDAY','13:20:00','15:00:00'),(6,2,7,10,'TUESDAY','10:50:00','12:30:00'),(7,2,5,5,'WEDNESDAY','13:20:00','15:00:00'),(8,2,6,8,'FRIDAY','08:50:00','10:30:00'),(9,3,7,5,'WEDNESDAY','10:30:00','12:30:00'),(10,3,9,11,'MONDAY','13:20:00','15:10:00'),(11,3,10,9,'THURSDAY','15:00:00','16:45:00');
/*!40000 ALTER TABLE `timetables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'hod001','$2b$10$pkaC/mJzFPIw/mjQkWMYjeRzSRIaHNY5NO6WU/et5fbhsJIqsKgn2','HOD','2026-09-08 18:00:13'),(2,'teacher001','$2b$10$B2Auexf1CVRL0aJTQ8ngOeI1t94qTNd4xL4ImzNGNDv1eon3cwnLC','TEACHER','2026-09-08 18:00:32'),(3,'student001','$2b$10$0oMB8vbmRRrSqIppsBtXJuxr1dPGJIl5SzdmkoMepjALHmVxU31YC','STUDENT','2026-09-09 15:00:32'),(4,'staff001','$2b$10$/msC15prKvWfYbjBGWhgXuvl4RucQeSSnDhmUaybY9pyjgpioNDFG','STAFF','2026-09-12 15:33:08'),(5,'admin','$2b$10$zfn3ho474QE1GwLSGrmK..q92FBdDKcD0bBO5cmH3kqx4ZZcRw3la','ADMIN','2026-09-13 12:10:12'),(6,'kumar','$hashedPassword','HOD','2026-09-13 13:23:18'),(8,'Manoj','$2b$10$nU37odBEMAQ.1bnApvMsMOkQNsXrVHVFXg/s0/P4HUedX03wq7YD2','STAFF','2026-09-14 04:02:22'),(11,'Venis velan','$2b$10$bZbebP/Owxmce.aY5APhde4B27UIkMeWV8/4Vi9aQigcmKfkB.A8O','STUDENT','2026-09-14 05:37:45'),(12,'classteacher','$2b$10$kuHvKvBNNHULc/UF2FcutO/E9VL.YApNUTaUbHzDoCUuXij.kgvbO','TEACHER','2026-09-14 05:45:13'),(13,'staff544','$2b$10$U3h/uROEWrCpE8Wn3OCRu.hkpe/MrwSrP2O5zblgh.y/6Hsq1TxMG','STAFF','2026-09-14 05:52:40'),(14,'staff765','$2b$10$0B8OYw1jExuC.jSCidvhAu0cMRORUvsAJ0/G/3F./5od6cvdKZEHC','STAFF','2026-09-14 10:47:50'),(15,'maths','$2b$10$LGqjDbg4EYxGiw3rH6mNf.c4c/b26n.IwjDTl/lKMtP1Pu5.3nUTy','STAFF','2026-09-14 14:36:59'),(16,'staff003','$2b$10$sz/sdvTxs73JL5nWf3GIpuO4.2J3zRGvtlpJMsKfPhp/Ov6IDho0e','STAFF','2026-09-14 14:38:58'),(17,'staff101','$2b$10$dTAE4E9xwIX.1hQl8ftQ/eKZ7YdGjSYNl/He/DxgNtXdn5qENbotO','STAFF','2026-09-14 14:40:23'),(18,'staff004','$2b$10$NQTZv9mXyTsCwSG96Afb3.3YBkfTdmYwUtubx9LFA1dBD01WOhpsu','STAFF','2026-09-14 14:41:27'),(19,'ECEStaff','$2b$10$4VKh5w1TcAbf8h92g99TsOKIbMLc63cnwHOLaQYpTfydB21aE3drK','TEACHER','2026-09-14 14:46:00'),(20,'ECEhod','$2b$10$ZGDwtsgZi.SqT7Jxyenfxu1wPr2mLePKpyXZZqL8qq4tPokiOMdJ2','HOD','2026-09-14 14:46:52'),(21,'EswaraKumar D','$2b$10$ReFq7WvODLm6Zc.Yf/cHC.2ZCff1Ttw0HyxIDJCJ8xCU0Cd8G4mo2','STUDENT','2026-09-14 14:51:37'),(22,'Pragathesh M','$2b$10$mn.IXcdV71Z7x0sY2ycbJ..HS8rrJh.1kgp2wkFdujmZLfL/xkV1G','STUDENT','2026-09-14 14:54:18'),(23,'Aadhithyan K','$2b$10$KBSIcj7eEiga1cgYE7TMMeIyQL/aVX1Zdaqy4yDwb8NHuge6yIi0W','STUDENT','2026-09-14 14:57:47'),(24,'Agilan M','$2b$10$ajao5Jx.9uUZnMTmGSzVXe.jPMGyI6VbRD1E3585lRAqY4Nh2JhUa','STUDENT','2026-09-14 14:59:29'),(25,'ManojKrishna','$2b$10$ijyauoVeBakjr5ARXwtP8ObN5RsLl7kVr4CVAhK3cyahEnttQOGOu','STUDENT','2026-09-14 15:01:50'),(26,'Gowtham','$2b$10$7zLG5EXnp1MeQKAwhS2sLuqcvVt.mEtVTaeyMBnBHWdggUoq8cg0i','STUDENT','2026-09-14 15:03:31'),(27,'Gowreeshwaran','$2b$10$b3a1P6l1iIhwxkg3BggK9ONeOtdmrTcG4/2EzVsKEdOhHhMGn9vtG','STUDENT','2026-09-14 15:05:40'),(28,'Sabarivasan','$2b$10$y771z2/A/1Z5aVWTVA1kYO4FNNhSbdlRcLienatVJu/oislUZUf4i','STUDENT','2026-09-14 15:07:06');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-15  1:40:57
