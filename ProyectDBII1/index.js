//Variables to connect to mongodb
const mongoose = require("mongoose");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
let db;
const URI =
  "mongodb+srv://nottwithtt:@cluster0.gi2w4fi.mongodb.net/dbprojectDataSet?retryWrites=true&w=majority";
const conn = mongoose.createConnection(URI, { useNewUrlParser: true });
const JSZIP = require("jszip");
const fileSaver = require("file-saver");
const Dataset = require("./Model/Dataset.js");
const User = require("./Model/User.js");
const Notification = require("./Model/Notification.js");
const mongoDB = require("mongodb");
const fs = require("fs");
const stream = require("stream");
//Variables to connect to neo4j
const neo4j = require("neo4j-driver");
const archiver = require("archiver");
const URI4J = "neo4j+s://ae1ed961.databases.neo4j.io";
const userNeo = "neo4j";
const password = "BThhcs9ej1_LMh4HtwD8l2YgZ69pixvoDA_2ybCKxxY";
const driver = neo4j.driver(URI4J, neo4j.auth.basic(userNeo, password));
const FileSaver = require("file-saver");

//Variables para conectarse a redis
const Redis = require("ioredis");
const redisDB = new Redis(
  "redis://default:b953727216e840ba8c2590cb8b4ceeee@usw1-ruling-falcon-34023.upstash.io:34023"
);

const mysql = require("mysql2");
const { ObjectID } = require("mongodb");
//const connection = mysql.createConnection(DATABASE_URL='mysql://zcvz5mpa0mku4a1wrhmr:pscale_pw_z55WN8fUijvuNvIk2MutRQIqMyt3tWYsyzsHMZ77hp@aws.connect.psdb.cloud/mysql-db1?ssl={"rejectUnauthorized":true}')
const connection = mysql.createConnection(
  (DATABASE_URL =
    'mysql://w6jbjudpml7cvcrl538h:pscale_pw_DHynCmh62hrIeTUITmp68RXeiUNJgBWM3OUHaXVyRqB@aws.connect.psdb.cloud/mysql-db1?ssl={"rejectUnauthorized":true}')
);

//Variables para conectarse a mysql
//const mysql = require('mysql2');
//const connection = mysql.createConnection(DATABASE_URL='mysql://y2mwym9l7m74esstdecs:pscale_pw_QEDQAOyFPYML89jzmSCYWpBtFb1U99bLtuUSkIVm8F8@aws.connect.psdb.cloud/mysql-db1?ssl={"rejectUnauthorized":true}');

//Opens the server.
app.listen(3000, () => {
  console.log("app listening in port 3000");
});

//Initializes the gridfs storage.
const storage = new GridFsStorage({
  db: conn,
  file: (req, file) => {
    return {
      filename: file.originalname,
      bucketName: "files",
    };
  },
});

let gfs;

//Warns that the connection has been opened.
conn.once("open", () => {
  console.log("Open");
  gfs = new mongoDB.GridFSBucket(conn.db, { bucketName: "files" });
});

//Declares multer middleware to use with gridfs.
const upload = multer({ storage });

//Sets the server to serve html files.
app.set("view engine", "html");

//Sets the server to get its resources from the specified directory.
app.use(express.static(__dirname + "/"));

//Sets the route for the signIn page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/SignIn.html");
});

//Sets the route for the register page
app.get("/Register", (req, res) => {
  res.sendFile(__dirname + "/public/Register.html");
});

//Sets the route fot the home page.
app.get("/Home", (req, res) => {
  res.sendFile(__dirname + "/public/Home.html");
});

//Sets the route for the searchDatasets page.
app.get("/SearchDatasets", (req, res) => {
  res.sendFile(__dirname + "/public/SearchDatasets.html");
});

//Sets the route for the searchUsers page
app.get("/SearchUsers", (req, res) => {
  res.sendFile(__dirname + "/public/SearchUsers.html");
});

//Sets the route for the MyDatasets page.
app.get("/MyDatasets", (req, res) => {
  res.sendFile(__dirname + "/public/MyDatasets.html");
});

//Sets the route for the CreateDataset page
app.get("/CreateDataset", (req, res) => {
  res.sendFile(__dirname + "/public/CreateDataset.html");
});

//Sets the route for the ViewDataset page
app.get("/ViewDataset", (req, res) => {
  res.sendFile(__dirname + "/public/ViewDataset.html");
});

//Sets the route for the ViewUser page
app.get("/ViewUser", (req, res) => {
  res.sendFile(__dirname + "/public/ViewUser.html");
});

//Sets the route for the Conversations page.
app.get("/Conversations", (req, res) => {
  res.sendFile(__dirname + "/public/Conversations.html");
});

//Sets the route for the Messages page.
app.get("/Messages", (req, res) => {
  res.sendFile(__dirname + "/public/Messages.html");
});

//Sets the route for the MyProfile page.
app.get("/MyProfile", (req, res) => {
  res.sendFile(__dirname + "/public/MyProfile.html");
});

//Sets the route for the FavoriteDataset page.
app.get("/FavoriteDatasets", (req, res) => {
  res.sendFile(__dirname + "/public/FavoriteDatasets.html");
});

//Sets an auxiliary route to upload a comment photo
app.post("/uploadMessageFile", upload.single("file"), (req, res) => {
  let idFile = req.file.id.toString();
  res.json({ idFile: idFile });
});

//Sets an auxiliary route to encrypt the password.
app.post("/encryptPassword", bodyParser.json(), async (req, res) => {
  console.log(req.body.Password);
  let arrayUsers = await searchAllUsers();
  let response = await isUser(arrayUsers, req.body.userName, req.body.Password);
  res.json({ answer: response });
});

//Sets an auxiliary route to find an User
app.post("/getUser", bodyParser.json(), async (req, res) => {
  let response = await findUserById(req.body.idUser);
  res.json({ user: response });
});

//Sets an auxiliary route to upload a Dataset photo
app.post(
  "/uploadPhotoDataset",
  upload.single("photoDataset"),
  async (req, res) => {
    let fileId = req.file.id;
    res.json({ answer: fileId });
  }
);

//Sets an auxiliary route to upload the files of the dataset.
app.post("/uploadFilesDataset", upload.array("filesDataset"), (req, res) => {
  let files = req.files;
  let ids = [];
  for (let i = 0; i < files.length; i++) {
    ids.push(files[i].id);
  }
  res.json({ answer: ids });
});

//Sets an axuiliary route to upload the dataset information to mongodb.
app.post("/uploadDataset", bodyParser.json(), async (req, res) => {
  let nameDataset = req.body.nameDataset;
  let descriptionDataset = req.body.description;
  let filesDataset = req.body.archivosDataset;
  let photoDataSet = req.body.photoDataset;
  let user = req.body.user;
  let dataset = await createDataset(
    nameDataset,
    descriptionDataset,
    filesDataset,
    photoDataSet
  );
  let idDatasetNeo4j = dataset.toString();
  await userAddsDataset(user, idDatasetNeo4j, nameDataset);
  let userFollowers = await getFollowingUsers(user);
  await createNotifications(userFollowers, user, nameDataset);

  res.json({ answer: idDatasetNeo4j });
});

//Sets an auxiliary route that serves the files of an specified dataset.
app.post("/getFilesDataset", bodyParser.json(), async (req, res) => {
  let idDataset = new mongoDB.ObjectId(req.body.dataId);
  let dataset = await findDataset(idDataset);
  let filesDataset = dataset.archivosDataset;
  let response = [];
  for (let i = 0; i < filesDataset.length; i++) {
    let metadataFile = await gfs.find({ _id: filesDataset[i] }).toArray();
    let objectMetadata = metadataFile[0];
    response.push(objectMetadata);
  }
  res.json({ dataFiles: response });
});

//Sets an auxiliary route that serves specific files from the dataset.
app.post("/getSomeFiles", bodyParser.json(), async (req, res) => {
  let Ids = req.body.data;
  const archive = archiver("zip", { zlib: { level: 9 } });
  res.set("Content-Type", "zip");
  res.set("Content-Disposition", `attachment; filename="archivos.zip"`);
  for (let i = 0; i < Ids.length; i++) {
    let idMongo = new mongoDB.ObjectId(Ids[i]);
    let metadataFile = await gfs.find({ _id: idMongo }).toArray();
    let objectMetadata = metadataFile[0];
    let filename = objectMetadata.filename;
    let downloadStream = await gfs.openDownloadStream(idMongo);
    archive.append(downloadStream, { name: filename });
  }
  archive.finalize();
  archive.pipe(res);
});

//Sets an auxiliary route that servers the photo of a dataset.
app.post("/getPhotoDataset", bodyParser.json(), async (req, res) => {
  let idDataset = req.body.data;
  let dataset = await findDataset(idDataset);
  let idPhoto = dataset.PhotoDataSet;
  console.log(idPhoto);
  let metadataFile = await gfs.find({ _id: idPhoto }).toArray();
  let objectMetadata = metadataFile[0];
  let downloadStream = await gfs.openDownloadStream(idPhoto);
  res.set("Content-Type", objectMetadata.contentType);
  res.set(
    "Content-Disposition",
    `attachment; filename=${objectMetadata.filename}`
  );
  downloadStream.pipe(res);
});

//Sets an auxiliary route that serves the photo of an user.
app.post("/getPhotoUser", bodyParser.json(), async (req, res) => {
  let idPhotoUser = req.body.photo;
  let idPhoto = new mongoDB.ObjectId(idPhotoUser);
  let metadataFile = await gfs.find({ _id: idPhoto }).toArray();
  let objectMetadata = metadataFile[0];
  let downloadStream = await gfs.openDownloadStream(idPhoto);
  res.set("Content-Type", objectMetadata.contentType);
  res.set(
    "Content-Disposition",
    `attachment; filename=${objectMetadata.filename}`
  );
  downloadStream.pipe(res);
});

/* Conversations */
//Sets an auxiliary route to create a conversation.
app.post("/createConversation", bodyParser.json(), async (req, res) => {
  let idUser1 = req.body.actualUser;
  let idUser2 = req.body.otherUser;

  let conversation = await createConversation(idUser1, idUser2);

  res.json({ res: conversation });
});

//Sets an auxiliary route that serves an user conversations.
app.post("/getConversationsOfUser", bodyParser.json(), async (req, res) => {
  let idUser = req.body.idUser;

  let conversations = new Map();
  conversations = await consultConversationsOfUser(idUser);
  res.json({ conver: conversations });
});

/* Messages */

//Sets an axuliary route that creates a message.
app.post("/createMessage", bodyParser.json(), async (req, res) => {
  let idAuthorUser = req.body.user;
  let idConversation = req.body.idConver;
  let content = req.body.content;
  let idFile = req.body.idFile;

  let message = await createMessage(
    idConversation,
    idAuthorUser,
    content,
    idFile
  );

  res.json({ message: message });
});

//Sets an axuiliary route that gets the messages of a conversation.
app.post("/getMessagesConversation", bodyParser.json(), async (req, res) => {
  let idConversation = req.body.conversation;

  messages = await loadMessages(idConversation);
  console.log(messages);

  res.json({ messages: messages });
});

/* Comments Dataset */
//Sets an auxiliary route to create a comment on a dataset.
app.post("/createComment", bodyParser.json(), async (req, res) => {
  let p_idUser = req.body.idUser;
  let p_photo = req.body.photo;
  let p_idCommentResponse = req.body.idCommentResponse;
  let p_idDataset = req.body.idDataset;
  let p_content = req.body.content;
  let p_file = req.body.file;

  let queryCreate = `INSERT INTO comment (idUser,photoUser, idCommentResponse, idDataset, creationDate, content, file) VALUES("${p_idUser}", "${p_photo}" ,${p_idCommentResponse}, "${p_idDataset}" , CONVERT_TZ(now(),  '+00:00', '-06:00') , "${p_content}", "${p_file}");`;

  connection.query(queryCreate, function (err, result) {
    if (err) throw err;
    res.json({ idComment: result.insertId, content: p_content });
  });
});

//Sets a route to get a dataset comments.
app.post("/getDatasetComments", bodyParser.json(), async (req, res) => {
  let datasetId = req.body.datasetId;
  let queryGet = `SELECT * FROM comment where idDataset = "${datasetId}";`;
  connection.query(queryGet, function (err, result) {
    if (err) throw err;
    res.json({ commentList: Object.assign(result) });
  });
});

//Sets a route to get a comment of a dataset.
app.post("/getComment", bodyParser.json(), async (req, res) => {
  let idComment = req.body.idComment;
  let queryGet = `SELECT * FROM comment where idComment = "${idComment}";`;
  connection.query(queryGet, function (err, result) {
    if (err) throw err;
    res.json({ res: Object.assign(result) });
  });
});

//Sets a route that gets  a response comment.
app.post("/getCommentsResponse", bodyParser.json(), async (req, res) => {
  let idComment = req.body.idComment;
  let queryGet = `SELECT * FROM comment where idCommentResponse = ${idComment};`;
  connection.query(queryGet, function (err, result) {
    if (err) throw err;
    res.json({ commentsResponse: Object.assign(result) });
  });
});

//Sets an auxiliary route that gets the information of the dataset.
app.post("/getInfoDataset", bodyParser.json(), async (req, res) => {
  let idDataset = new mongoDB.ObjectId(req.body.data);
  let dataset = await findDataset(idDataset);
  let name = dataset.name;
  let description = dataset.description;
  let date = dataset.DateOfInsert;
  res.json({ name: name, description: description, dateOfInsert: date });
});

//Sets a route to get the users that downloaded a dataset.
app.post("/getDownloadedUsers", bodyParser.json(), async (req, res) => {
  let idDataset = req.body.data;
  let users = await downloadedUserDataset(idDataset);
  res.json({ users: users });
});

//Sets a route to add a user download to a dataset.
app.post("/addUserDownload", bodyParser.json(), async (req, res) => {
  let idDataset = req.body.data;
  let idUser = req.body.user;
  let response = await downloadDataset(idUser, idDataset);
  res.json({ answer: true });
});

//Sets a route to encript a password in the register side.
app.post("/encryptPasswordRegister", bodyParser.json(), (req, res) => {
  let unencryptedPassword = req.body.pass;
  let encryptedPassword = encryptPassword(unencryptedPassword);
  res.json({ encrypted: encryptedPassword });
});

//Sets a route to create a new user.
app.post("/insertUser", bodyParser.json(), async (req, res) => {
  let firstName = req.body.name;
  let firstSurname = req.body.lastName;
  let username = req.body.username;
  let photo = new mongoDB.ObjectId(req.body.photo);
  let password = req.body.password;
  let birthDate = req.body.birthday;
  let user = await createUserMongo(
    username,
    password,
    firstName,
    firstSurname,
    birthDate,
    photo
  );
  let responseUser = await findUserById(user.insertedId);
  let idNeo4j = user.insertedId.toString();
  console.log(idNeo4j);
  console.log("Buenos dias");
  await createUser(idNeo4j, username);
  res.json({ user: responseUser });
});

//Sets a route to get all users.
app.post("/getUsers", async (req, res) => {
  let users = await searchAllUsers();
  res.json({ answer: users });
});

//Sets a route to upload an user photo.
app.post("/uploadUserPhoto", upload.single("photoUser"), (req, res) => {
  let idPhoto = req.file.id;
  res.json({ idPhoto: idPhoto });
});

//Sets a route to get all users followed by the entry user.
app.post("/getFollowedUsers", bodyParser.json(), async (req, res) => {
  let idUser = req.body.user;
  let users = await getFollowedUsers(idUser);
  res.json({ users: users });
});

//Sets a route to get all users following the entry user.
app.post("/getFollowingUsers", bodyParser.json(), async (req, res) => {
  let idUser = req.body.user;
  let users = await getFollowingUsers(idUser);
  res.json({ users: users });
});

//Sets a route to update the password of an user.
app.post("/updatePasswordUser", bodyParser.json(), async (req, res) => {
  let update = await updatePasswordMongo(req.body.username, req.body.pass);
  res.json({ result: update });
});

//Sets a route to update the name of an user.
app.post("/updateNameUser", bodyParser.json(), async (req, res) => {
  let update = await updateNameMongo(req.body.username, req.body.name);
  res.json({ result: update });
});

//Sets a route to update the last name of an user.
app.post("/updateLastNameUser", bodyParser.json(), async (req, res) => {
  let update = await updateLastNameMongo(req.body.username, req.body.lastName);
  res.json({ result: update });
});

//Sets a route to update the user photoId.
app.post("/updatePhotoIdUser", bodyParser.json(), async (req, res) => {
  let idPhoto = req.body.photo;
  let username = req.body.username;
  let response = await updatePhotoMongo(username, idPhoto);
  res.json({ result: response });
});

//Sets a route that serves a list of users searched by an specific query.
app.post("/usersSearch", bodyParser.json(), async (req, res) => {
  let query = req.body.query;
  let response = await searchUsernames(query);
  res.json({ result: response });
});

//Sets a route that gets all the likes from a dataset.
app.post("/getLikesDataset", bodyParser.json(), async (req, res) => {
  let idDataset = req.body.data;
  let response = await getLikesDataset(idDataset);
  console.log(response);
  res.json({ result: response });
});

//Sets a route that serves the results of a dataset search by name.
app.post("/nameDatasetSearch", bodyParser.json(), async (req, res) => {
  let query = req.body.query;
  let response = await searchAllDataSetByName(query);
  res.json({ result: response });
});

//Sets a route that serves the results of a dataset search by description.
app.post("/descriptionDatasetSearch", bodyParser.json(), async (req, res) => {
  let query = req.body.query;
  let response = await searchAllDataSetByDescription(query);
  res.json({ result: response });
});

//Sets a route that serves the user's liked datasets.
app.post("/getUserLikedDatasets", bodyParser.json(), async (req, res) => {
  let idUser = req.body.user;
  let response = await getLikedDatasets(idUser);
  res.json({ result: response });
});

//Sets a route for deleting an user like.
app.post("/deleteUserLike", bodyParser.json(), async (req, res) => {
  let idUser = req.body.user;
  let idDataset = req.body.dataset;
  await deleteUserLike(idUser, idDataset);
  res.json({ result: true });
});

//Sets a route for adding a user like.
app.post("/addUserLike", bodyParser.json(), async (req, res) => {
  let idUser = req.body.user;
  let idDataset = req.body.dataset;
  await addUserLike(idUser, idDataset);
  res.json({ result: true });
});

//Sets a route for adding a user follow.
app.post("/addUserFollow", bodyParser.json(), async (req, res) => {
  let idUserFollows = req.body.follows;
  let idUserFollowed = req.body.followed;
  await addUserFollow(idUserFollows, idUserFollowed);
  res.json({ result: true });
});

//Sets a route for deleting an user follow.
app.post("/deleteUserFollow", bodyParser.json(), async (req, res) => {
  let idUserFollows = req.body.follows;
  let idUserFollowed = req.body.followed;
  await deleteUserFollow(idUserFollows, idUserFollowed);
  res.json({ result: true });
});

//Sets a route that serves all user notifications.
app.post("/getNotificationsUser", bodyParser.json(), async (req, res) => {
  let idUser = req.body.userId;
  let response = await getUserNotifications(idUser);
  res.json({ result: response });
});

//Sets a route that deletes a notification.
app.post("/deleteNotification", bodyParser.json(), async (req, res) => {
  let idDelete = req.body.idNotification;
  await deleteNotification(idDelete);
  res.json({ result: true });
});
// # # # # # # # END VALUES # # # # # # #

let id;

//Sets a route that uploads a file //## TESTING ##//
app.post("/upload", upload.array("file"), (req, res) => {
  const files = req.files;
  console.log(req.body);
  const Ids = [];
  files.forEach((element) => {
    console.log(element.id);
    Ids.push(element.id);
  });
  mongoose.connect(URI);
  Dataset.create({
    name: "pruebaDataset",
    description: "Para probar",
    archivosDataset: Ids,
  });
  res.json({ body: req.body });
});

//Sets a route that downloads the requested Dataset.
app.get("/dataset/:id", async function (req, res) {
  //IMPORTANT
  // id = ObjectID
  // The URL id  has to be parsed into a string with ObjectId.toString() before
  // passing it to the URL-> /dataset/:id
  mongoose.connect(URI);
  let idDataset = new mongoDB.ObjectId(req.params.id);
  const dataset = await findDataset(idDataset);
  let Idsfiles = dataset.archivosDataset;
  const archive = archiver("zip", { zlib: { level: 9 } });
  res.set("Content-Type", "zip");
  res.set(
    "Content-Disposition",
    `attachment; filename=${dataset.name}.zip; returnUrl=${encodeURIComponent(
      req.query.returnUrl
    )}`
  );
  for (let i = 0; i < Idsfiles.length; i++) {
    let metadataFile = await gfs.find({ _id: Idsfiles[i] }).toArray();
    let objectMetadata = metadataFile[0];
    let filename = objectMetadata.filename;
    let downloadStream = await gfs.openDownloadStream(Idsfiles[i]);
    archive.append(downloadStream, { name: filename });
  }
  archive.finalize();
  archive.pipe(res);
});

//Sets a route to serve the datasets uploaded by the user.
app.post("/datasets", bodyParser.json(), async function (req, res) {
  let request = await getUploadedDatasets(req.body.data);
  res.json({ response: request });
});

//Sets a route to get the object Id of an string.
app.post("/getObjectId", (req, res) => {
  let id = mongoose.Types.ObjectId(req.body.data);
  res.json({ idDataset: id });
});

//Function that verifies if the User exists in the database.
//Function that create a copy of dataset with other name
app.post("/cloneDataset", bodyParser.json(), async (req, res) => {
  let idDataset = req.body.idDataset;
  let newName = req.body.newName;
  let userId = req.body.idUser;
  let response = await cloneDataset(idDataset, newName);
  let newResponse = await response.toString();
  await userAddsDataset(userId, newResponse, newName);
  res.json({ result: true });
});

//Function that verifies if the User exists in the database.
async function isUser(Users, username, password) {
  let flag = false;
  let user;
  for (let i = 0; i < Users.length; i++) {
    let boolean = await bcrypt.compare(password, Users[i].password);
    if (username === Users[i].username && boolean) {
      flag = true;
      user = Users[i];
    }
  }

  return { isUser: flag, user: user };
}

//Function that finds a dataset and returns it.
function findDataset(idDataset) {
  mongoose.connect(URI);
  const dataset = Dataset.findById(idDataset);
  return dataset;
}

//Function that creates a User in mongodb.
async function createUserMongo(
  username,
  password,
  firstName,
  firstSurname,
  birthDate,
  photoUser
) {
  let photo = new mongoDB.ObjectId(photoUser);
  let birthday = new Date(birthDate);
  let user = await conn.collection("users").insertOne({
    username: username,
    password: password,
    firstName: firstName,
    firstSurname: firstSurname,
    birthDate: birthday,
    photo: photo,
  });
  return user;
}

//Function that creates a dataset in mongodb.
async function createDataset(
  nameDataset,
  descriptionDataset,
  archivosDataset,
  photoDataSet
) {
  let objectIds = [];
  for (let i = 0; i < archivosDataset.length; i++) {
    objectIds.push(new mongoDB.ObjectId(archivosDataset[i]));
  }
  let photo = new mongoDB.ObjectId(photoDataSet);
  console.log(objectIds);
  let dataset = await conn.collection("datasets").insertOne({
    name: nameDataset,
    description: descriptionDataset,
    archivosDataset: objectIds,
    DateOfInsert: new Date(),
    PhotoDataSet: photo,
  });
  return dataset.insertedId;
}

//Fins an specific user.
async function findUserById(idUser) {
  let idSearch = new mongoDB.ObjectId(idUser);
  let userdb = await conn.collection("users").find({ _id: idSearch });
  let response = await userdb.toArray();
  return response;
}

//This function searches for only one user.
async function searchByOneUsername(username) {
  let userdb = await conn.collection("users").findOne({
    username: { $eq: username },
  });

  let response = await userdb.toArray();

  return response;
}

//Function that updates the password in mongodb.
async function updatePasswordMongo(username, password) {
  let result = await conn
    .collection("users")
    .updateOne({ username: username }, { $set: { password: password } });
  return result;
}

//Function that updates the name in mongodb.
async function updateNameMongo(username, name) {
  let result = await conn
    .collection("users")
    .updateOne({ username: username }, { $set: { firstName: name } });
  return result;
}

//Function that updates the lastName in mongodb.
async function updateLastNameMongo(username, lastName) {
  let result = await conn
    .collection("users")
    .updateOne({ username: username }, { $set: { firstSurname: lastName } });
  return result;
}

//Function that updates the photo of an user in mongodb.
async function updatePhotoMongo(username, idPhoto) {
  let idUpdate = new mongoDB.ObjectId(idPhoto);
  let result = await conn
    .collection("users")
    .updateOne({ username: username }, { $set: { photo: idUpdate } });
  return result;
}

//Function that searches for all users with an equal name.
async function searchAllUsersEqualsName(name) {
  let userdb = await conn.collection("users").find({
    FirstName: {
      $eq: name,
    },
  });

  let response = await userdb.toArray();

  return response;
}

//Function that searches for all users with an equal surname.
async function searchAllUsersEqualsSurname(firstSurname) {
  const userdb = await conn.collection("users").find({
    FirstSurname: {
      $eq: firstSurname,
    },
  });

  let response = await userdb.toArray();

  return response;
}

// Function that searches for a specific dataset.
async function searchDataSetById(datasetId) {
  mongoose.connect(URI);
  const dataset = Dataset.findById(datasetId);
  return dataset;
}

// Matches a query on the search of name dataset.
async function searchAllDataSetByName(criterio) {
  let regex = new RegExp(criterio.split(" ").join("|"), "i");
  let datasetdb = await conn.collection("datasets").find({
    name: {
      $regex: regex,
    },
  });
  let response = await datasetdb.toArray();
  return response;
}

//Matches a query on the search of users.
async function searchUsernames(username) {
  let regex = new RegExp(username.split(" ").join(".+"), "i");
  let userdb = await conn.collection("users").find({
    username: {
      $regex: regex,
    },
  });
  let response = await userdb.toArray();
  console.log(response);
  return response;
}

//Matches a query on the search of datasets by description.
async function searchAllDataSetByDescription(description) {
  let regex = new RegExp(description.split(" ").join("|"), "i");
  let datasetdb = await conn.collection("datasets").find({
    description: {
      $regex: regex,
    },
  });
  let response = await datasetdb.toArray();
  return response;
}

//Function that searches for all users.
async function searchAllUsers() {
  let users = await conn.collection("users").find();
  let userList = await users.toArray();

  return userList;
}

//Function that searches for all the notifications of an user.
async function getUserNotifications(idUser) {
  let idObject = new mongoDB.ObjectId(idUser);
  let notifications = await conn.collection("notifications").find(
    {
      id_userNotifier: idObject,
    },
    { sort: { dateNotifies: 1 } }
  );
  let result = await notifications.toArray();
  return result;
}

//Function that encrypts a password.
function encryptPassword(password) {
  const saltRounds = 10;
  var encrypted_password = bcrypt.hashSync(password, saltRounds);
  return encrypted_password;
}
//Function that creates a notification.
async function createNotifications(notifiedUsers, userUploads, name) {
  let submit = new mongoDB.ObjectId(userUploads);
  for (let i = 0; i < notifiedUsers.length; i++) {
    let notified = new mongoDB.ObjectId(notifiedUsers[i].id_mongo);
    let not = await conn.collection("notifications").insertOne({
      id_userSubmit: submit,
      id_userNotifier: notified,
      nameDataSet: name,
      dateNotifies: new Date(),
    });
  }
}

//Function that deletes a notification.
async function deleteNotification(idDelete) {
  let submit = new mongoDB.ObjectId(idDelete);
  await conn.collection("notifications").deleteOne({ _id: submit });
}

async function cloneDataset(idDataset, newName) {
  let idSubmit = new mongoDB.ObjectId(idDataset);
  let original = await conn.collection("datasets").find({ _id: idSubmit });
  let final = await original.toArray();
  console.log(original);
  let CloneDT = await createDataset(
    newName,
    final[0].description,
    final[0].archivosDataset,
    final[0].PhotoDataSet
  );
  return CloneDT;
}
//Algunos metodos de Neo4j.

//Neo4j .
//Function that creates a User in neo4j.
async function createUser(User, username) {
  const session = driver.session({ database: "neo4j" });
  try {
    const query = `CREATE (:User {id_mongo: "${User}", username: "${username}"})`;
    await session.executeWrite((transaction) => transaction.run(query));
  } catch (error) {
    console.error(error);
  } finally {
    session.close();
  }
}

//Function that adss a "Like" relation between an user and a dataset, it does it in both ways.
async function addUserLike(User, Dataset) {
  console.log(User);
  console.log(Dataset);
  console.log("Addlike");
  const session = driver.session({ database: "neo4j" });
  try {
    const query = `MATCH (us:User {id_mongo: "${User}"}),(dat:Dataset {id_mongo: "${Dataset}"}) 
        MERGE (us)-[:LIKES {points: ${1}}]->(dat)-[:LIKED_BY {points: ${1}}]->(us)`;
    await session.executeWrite((transaction) => transaction.run(query));
  } catch (error) {
    console.error(error);
  } finally {
    session.close();
  }
}

//Function that deletes an user like from neo4j.
async function deleteUserLike(User, Dataset) {
  console.log(User);
  console.log(Dataset);
  const session = driver.session({ database: "neo4j" });
  try {
    const query = `Match (us:User {id_mongo: "${User}"})-[rel:LIKES]->(dat:Dataset {id_mongo: "${Dataset}"})-[relTwo:LIKED_BY]->(us:User {id_mongo: "${User}"})
        DELETE rel,relTwo`;
    await session.executeWrite((transaction) => transaction.run(query));
  } catch (error) {
    console.error(error);
  } finally {
    session.close();
  }
}

//Function that create a FOLLOW and FOLLOWED BY relation between two users.
async function addUserFollow(UserOne, UserTwo) {
  console.log(UserOne);
  console.log(UserTwo);
  console.log("Add");
  const session = driver.session({ database: "neo4j" });
  try {
    const query = `MATCH (follow: User {id_mongo: "${UserOne}"}), (followed: User {id_mongo: "${UserTwo}"}) MERGE (follow)-[:FOLLOWS]->(followed)-[:FOLLOWED_BY]->(follow)`;
    await session.executeWrite((transaction) => transaction.run(query));
  } catch (error) {
    console.error(error);
  } finally {
    session.close();
  }
}

//Delets a FOLLOW and FOLLOWED BY relation between two users.
async function deleteUserFollow(UserOne, UserTwo) {
  console.log(UserOne);
  console.log(UserTwo);
  console.log("Delete");
  const session = driver.session({ database: "neo4j" });
  try {
    const firstPartQuery = `MATCH (follow: User {id_mongo: "${UserOne}"})-[rel:FOLLOWS]->(followed: User {id_mongo: "${UserTwo}"})
        DELETE rel`;
    await session.executeWrite((transaction) =>
      transaction.run(firstPartQuery)
    );
    const secondPartQuery = `MATCH (followed: User {id_mongo: "${UserTwo}"})-[rel:FOLLOWED_BY]->(follow: User {id_mongo: "${UserOne}"})
        DELETE rel`;
    await session.executeWrite((transaction) =>
      transaction.run(secondPartQuery)
    );
  } catch (error) {
    console.error(error);
  }
}

//Function that adds an 'Upload" relation between a dataset and an user in both ways.
async function userAddsDataset(User, Dataset, nameDataSet) {
  const session = driver.session({ database: "neo4j" });
  try {
    const query = `MATCH (us: User {id_mongo: "${User}"})
        MERGE (us)-[:UPLOADS]->(:Dataset {id_mongo: "${Dataset}",name: "${nameDataSet}"})-[:UPLOADED_BY]->(us)`;
    await session.executeWrite((transaction) => transaction.run(query));
  } catch (error) {
    console.error(error);
  } finally {
    session.close();
  }
}

//Function that deletes an user dataset in neo4j.
async function userDeletesDataset(Dataset) {
  const session = driver.session({ database: "neo4j" });
  try {
    const query = `MATCH (data: Dataset {id_mongo: "${Dataset}"}) DETACH data DELETE data`;
    await session.executeWrite((transaction) => transaction.run(query));
  } catch (error) {
    console.error(error);
  } finally {
    session.close();
  }
}

//Function that deletes an user from neo4j.
async function deleteUser(User) {
  const session = driver.session({ database: "neo4j" });
  try {
    let query = `MATCH (n:Dataset)-[:UPLOADED_BY]->(us:User {id_mongo: "${User}"})
        DETACH n,us DELETE n,us`;
    await session.executeWrite((transaction) => transaction.run(query));
  } catch (error) {
    console.log(error);
  } finally {
    session.close();
  }
}

//Function that creates a 'download relation between an user and a dataset.
async function downloadDataset(User, Dataset) {
  const session = driver.session({ database: "neo4j" });
  try {
    let query = `MATCH (us:User {id_mongo: "${User}"}),(dat:Dataset {id_mongo:"${Dataset}"})
        MERGE (us)-[:DOWNLOADS]->(dat)-[:DOWNLOADED_BY]->(us)`;
    await session.executeWrite((transaction) => transaction.run(query));
  } catch (error) {
    console.log(error);
  } finally {
    session.close();
  }
}

//Function that returns the users that have downloaded a particular dataset.
async function downloadedUserDataset(Dataset) {
  const session = driver.session({ database: "neo4j" });
  //Se guardan los nodos de usuarios que han descargado el dataset
  //A partir de este se pueden consultar todos estos usuarios y cuantos son mediante el largo
  //de la lista.
  let users = [];
  try {
    let query = `MATCH (us:User)-[:DOWNLOADS]-(dat:Dataset {id_mongo:"${Dataset}"}) RETURN us`;
    const cursor = await session.executeRead((transaction) =>
      transaction.run(query)
    );
    cursor.records.forEach((element) => {
      let node = element._fields[0].properties;
      users.push(node);
    });
    return users;
  } catch (error) {
    console.log(error);
  } finally {
    session.close();
  }
}

//Function that returns all the datasets liked by a user.
async function getLikedDatasets(User) {
  const session = driver.session({ database: "neo4j" });
  let likedDatasets = [];
  try {
    let query = `MATCH (n:Dataset)-[:LIKED_BY]->(us:User {id_mongo: "${User}"}) RETURN n`;
    const cursor = await session.executeRead((transaction) =>
      transaction.run(query)
    );
    cursor.records.forEach((element) => {
      let node = element._fields[0].properties;
      likedDatasets.push(node);
    });
    return likedDatasets;
  } catch (error) {
    console.log(error);
  } finally {
    session.close();
  }
}

//Esta funcion retorna todos los Usuarios a los que sigue el usuario de entrada
//Para implementar en dos funcionalidades: Traer los datos de los usuarios que sigue el usuario
//logeado y presentarlos, O si un usuario sube un dataset, se le notifica a los demas a partir del
//arreglo
//This function returns every User followed by the entry user.
//Two functionalities: Get information of the followed users and to notify the user.
async function getFollowedUsers(User) {
  const session = driver.session({ database: "neo4j" });
  let followedUsers = [];
  try {
    let query = `MATCH (us:User)-[:FOLLOWED_BY]->(entry:User {id_mongo: "${User}"}) RETURN us`;
    const cursor = await session.executeRead((transaction) =>
      transaction.run(query)
    );
    cursor.records.forEach((element) => {
      let node = element._fields[0].properties;
      followedUsers.push(node);
    });
    return followedUsers;
  } catch (error) {
    console.log(error);
  } finally {
    session.close();
  }
}

//Function that returns all users that FOLLOW the entry user.
async function getFollowingUsers(User) {
  const session = driver.session({ database: "neo4j" });
  let followedUsers = [];
  try {
    let query = `MATCH (us:User)-[:FOLLOWS]->(entry:User {id_mongo: "${User}"}) RETURN us`;
    const cursor = await session.executeRead((transaction) =>
      transaction.run(query)
    );
    cursor.records.forEach((element) => {
      let node = element._fields[0].properties;
      followedUsers.push(node);
    });
    return followedUsers;
  } catch (error) {
    console.log(error);
  } finally {
    session.close();
  }
}

//Function that returns all datasets uploaded by the entry user.
async function getUploadedDatasets(User) {
  const session = driver.session({ database: "neo4j" });
  let dataSets = [];
  try {
    let query = `MATCH (dat:Dataset)-[:UPLOADED_BY]->(us:User {id_mongo:"${User}"}) RETURN dat`;
    const cursor = await session.executeRead((transaction) =>
      transaction.run(query)
    );
    cursor.records.forEach((element) => {
      let node = element._fields[0].properties;
      dataSets.push(node);
    });
    return dataSets;
  } catch (error) {
    console.log(error);
  } finally {
    session.close();
  }
}

//Function that returns the quantity of likes of a dataset from neo4j.
async function getLikesDataset(dataset) {
  const session = driver.session({ database: "neo4j" });
  let users = [];
  try {
    let query = `MATCH (us:User)-[:LIKES]->(dat:Dataset {id_mongo:"${dataset}"}) RETURN us`;
    const cursor = await session.executeRead((transaction) =>
      transaction.run(query)
    );
    cursor.records.forEach((element) => {
      let node = element._fields[0].properties;
      users.push(node);
    });
    console.log(users);
    return users;
  } catch (error) {
    console.log(error);
  } finally {
    session.close();
  }
}

//Returns a list containing the user in case the user uplaoded the specified dataset.
async function isUserDataset(user, dataset) {
  const session = driver.session({ database: "neo4j" });
  let users = [];
  try {
    let query = `MATCH (us:User {id_mongo: "${user}"})-[:UPLOADS]->(dat:Dataset {id_mongo:"${dataset}"}) RETURN us`;
    const cursor = await session.executeRead((transaction) =>
      transaction.run(query)
    );
    cursor.records.forEach((element) => {
      let node = element._fields[0].properties;
      users.push(node);
    });
    console.log(users);
    return users;
  } catch (error) {
    console.log(error);
  } finally {
    session.close();
  }
}

/*
  Function that creates a conversation between two users and verifies that it is not created.
*/
async function createConversation(idUser1, idUser2) {
  if (idUser1 != idUser2) {
    let x = await redisDB.keys("*");
    let isCreate = false;
    let idExistConversation = "";

    for (let i = 0; i < x.length; i++) {
      let keyName = x[i];
      if (keyName.substring(0, 3) == "con") {
        let u1 = await redisDB.hget(x[i], "user1");
        let u2 = await redisDB.hget(x[i], "user2");

        if (
          (u1 == idUser1 && u2 == idUser2) ||
          (u1 == idUser2 && u2 == idUser1)
        ) {
          isCreate = true;
          idExistConversation = x[i];
          break;
        }
      }
    }

    if (isCreate == false) {
      let i = 0;
      let name = "con-";

      while ((await redisDB.exists(name + i)) == true) {
        i += 1;
      }
      name = name + i;
      await redisDB.hmset(name, "user1", idUser1, "user2", idUser2);
      return { isCreate: isCreate, nameConversation: name };
    } else {
      return { isCreate: isCreate, nameConversation: idExistConversation };
    }
  }
}

/* 
Function that creates a message in a conversation with a specified id 
*/
async function createMessage(conversation, idAuthor, content, file) {
  let name = "mes-" + conversation + "-";
  let message = {};
  let i = 0;

  while ((await redisDB.exists(name + i)) == true) {
    i += 1;
  }
  name = name + i;

  message.conver = conversation;
  message.name = name;
  message.idAuthor = idAuthor;
  message.content = content;
  message.file = file;

  await redisDB.hmset(
    name,
    "idAuthor",
    idAuthor,
    "content",
    content,
    "file",
    file
  );
  return message;
}

/*
Consult name to Conversation of two users
*/
async function consultConversation(idUser1, idUser2) {
  let x = await redisDB.keys("*");
  let nameConversation = "";

  for (let i = 0; i < x.length; i++) {
    let keyName = x[i];
    if (keyName.substring(0, 3) == "con") {
      let u1 = await redisDB.hget(x[i], "user1");
      let u2 = await redisDB.hget(x[i], "user2");
      if (u1 == idUser1 && u2 == idUser2) {
        nameConversation = x[i];
        break;
      }
    }
  }
  return nameConversation;
}

async function consultConversationsOfUser(idUser) {
  let x = await redisDB.keys("*");
  let conversationsUser = {};

  for (let i = 0; i < x.length; i++) {
    let keyName = x[i];
    if (keyName.substring(0, 3) == "con") {
      let key = x[i];
      let u1 = await redisDB.hget(key, "user1");
      let u2 = await redisDB.hget(key, "user2");
      if (idUser == u1 || idUser == u2) {
        conversationsUser[key] = { user1: u1, user2: u2 };
      }
    }
  }
  return conversationsUser;
}

async function loadMessages(idConversation) {
  let messages = {};

  let keyName = "mes-" + idConversation + "-";
  let i = 0;
  let x = await redisDB.hvals(keyName + i);

  while (x.length != 0) {
    let x1 = await redisDB.hget(keyName + i, "idAuthor");
    let x2 = await redisDB.hget(keyName + i, "content");
    let x3 = await redisDB.hget(keyName + i, "file");

    messages[i] = { idAuthor: x1, content: x2, file: x3 };
    i++;
    x = await redisDB.hvals(keyName + i);
  }

  return messages;

  /*mapMessages.set(0,{'idAuthor': '1234','content':'Hola'});
    let mapMessage = mapMessages.get(0);
    console.log(mapMessage['hola']);*/
}
