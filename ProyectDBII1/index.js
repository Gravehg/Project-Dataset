//Variables para conectarse a mongo.
const mongoose = require('mongoose');
const multer = require("multer");
const {GridFsStorage} = require('multer-gridfs-storage');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const ejs = require('ejs');
const bcrypt = require('bcrypt');
let db;
const URI = 'mongodb+srv://nottwithtt:Nicolita1998+@cluster0.gi2w4fi.mongodb.net/dbprojectDataSet?retryWrites=true&w=majority';
const conn = mongoose.createConnection(URI, {useNewUrlParser: true});
const JSZIP = require('jszip');
const fileSaver = require('file-saver');
const Dataset = require('./Model/Dataset.js');
const User = require('./Model/User.js');
const Notification = require('./Model/Notification.js');
const mongoDB = require('mongodb');
const fs = require('fs');
const stream = require('stream');
const { PassThrough } = stream;
//Variables para conectarse a Neoj4
const neo4j = require('neo4j-driver');
const archiver = require('archiver');
const URI4J = 'neo4j+s://ae1ed961.databases.neo4j.io';
const userNeo = 'neo4j';
const password = 'BThhcs9ej1_LMh4HtwD8l2YgZ69pixvoDA_2ybCKxxY';
const driver = neo4j.driver(URI4J, neo4j.auth.basic(userNeo, password));
const FileSaver  = require('file-saver');

//Variables para conectarse a redis
const Redis = require("ioredis");
const redisDB = new Redis("redis://default:b953727216e840ba8c2590cb8b4ceeee@usw1-ruling-falcon-34023.upstash.io:34023");

//const mysql = require('mysql2');
const { ObjectID } = require('mongodb');
//const connection = mysql.createConnection(DATABASE_URL='mysql://zcvz5mpa0mku4a1wrhmr:pscale_pw_z55WN8fUijvuNvIk2MutRQIqMyt3tWYsyzsHMZ77hp@aws.connect.psdb.cloud/mysql-db1?ssl={"rejectUnauthorized":true}')
//const connection = mysql.createConnection(DATABASE_URL='mysql://k8w5dqlcxj8v28k02gsf:pscale_pw_1d4kuBj5aLkoednqqN5O1blIr5Mt4ml2lLJ7L5agcZR@aws.connect.psdb.cloud/mysql-db1?ssl={"rejectUnauthorized":true}');


//Variables para conectarse a mysql
const mysql = require('mysql2')
const connection = mysql.createConnection(DATABASE_URL='mysql://venzpryxbz9s1aczjacm:pscale_pw_THsxsvSbfAbmpNLOYR7wDzwkvM19I6yXyd18w1d7KL6@aws.connect.psdb.cloud/mysql-db1?ssl={"rejectUnauthorized":true}')


app.listen(3000,()=>{
    console.log('app listening in port 3000');
});


const storage = new GridFsStorage({ db: conn,
    file:(req,file)=>{
        return {
            filename: file.originalname,
            bucketName: 'files',
        };
    } 
});

let gfs;

conn.once('open',()=>{
    console.log('Open');
    gfs = new mongoDB.GridFSBucket(conn.db, {bucketName: 'files'});
});

const upload = multer({storage});


app.set('view engine','html');

app.use(express.static(__dirname+'/'));


app.get('/',(req,res)=>{
    res.sendFile(__dirname+'/public/SignIn.html');
});

app.get('/Register',(req,res)=>{
    res.sendFile(__dirname+'/public/Register.html');
});

app.get('/Home',(req,res)=>{
    res.sendFile(__dirname+'/public/Home.html');
});

app.get('/SearchDatasets',(req,res)=>{
    res.sendFile(__dirname+'/public/SearchDatasets.html');
});

app.get('/SearchUsers',(req,res)=>{
    res.sendFile(__dirname+'/public/SearchUsers.html');
});

app.get('/MyDatasets',(req,res)=>{
    res.sendFile(__dirname+'/public/MyDatasets.html');
});

app.get('/CreateDataset',(req,res)=>{
    res.sendFile(__dirname+'/public/CreateDataset.html');
});

app.get('/ViewDataset',(req,res)=>{
    res.sendFile(__dirname+'/public/ViewDataset.html');
});

app.get('/ViewUser',(req,res)=>{
    res.sendFile(__dirname+'/public/ViewUser.html');
});

app.get('/Conversations',(req,res)=>{
    res.sendFile(__dirname+'/public/Conversations.html');
});

app.get('/Messages',(req,res)=>{
    res.sendFile(__dirname+'/public/Messages.html');
});

app.get('/MyProfile',(req,res)=>{
    res.sendFile(__dirname+'/public/MyProfile.html');
});

app.get('/FavoriteDatasets',(req,res)=>{
    res.sendFile(__dirname+'/public/FavoriteDatasets.html');
});


app.post('/uploadCommentFile',upload.single('photo'), (req,res)=> {
    let idPhoto = req.file.id.toString();
    subirFoto(idPhoto);
});

app.post('/encryptPassword',bodyParser.json(),async (req,res)=>{
    console.log(req.body.Password);
    let arrayUsers = await searchAllUsers();
    let response = await isUser(arrayUsers,req.body.userName,req.body.Password);
    res.json({"answer": response});
})

app.post('/getUser',bodyParser.json(),async (req,res)=>{
    let response = await findUserById(req.body.idUser);
    res.json({"user": response});
})

app.post('/uploadPhotoDataset',upload.single('photoDataset'),async (req,res)=>{
    let fileId = req.file.id;
    res.json({"answer":fileId});
})

app.post('/uploadFilesDataset',upload.array('filesDataset'),(req,res)=>{
    let files = req.files;
    let ids = [];
    for(let i =0;i<files.length;i++){
        ids.push(files[i].id);
    }
    res.json({"answer":ids});
})

app.post('/uploadDataset',bodyParser.json(),async (req,res)=>{
    let nameDataset = req.body.nameDataset;
    let descriptionDataset = req.body.description;
    let filesDataset = req.body.archivosDataset;
    let photoDataSet = req.body.photoDataset;
    let user = req.body.user;
    let dataset = await createDataset(nameDataset,descriptionDataset,filesDataset,photoDataSet);
    let idDatasetNeo4j = dataset.toString();
    await userAddsDataset(user,idDatasetNeo4j,nameDataset);
    let userFollowers = await getFollowingUsers(user);
    createNotifications(userFollowers,user,nameDataset);

})

app.post('/getFilesDataset',bodyParser.json(), async (req,res)=>{
    let idDataset = new mongoDB.ObjectId(req.body.dataId);
    let dataset = await findDataset(idDataset);
    let filesDataset = dataset.archivosDataset;
    let response = [];
    for(let i =0;i<filesDataset.length;i++){
        let metadataFile = await gfs.find({"_id": filesDataset[i]}).toArray();
        let objectMetadata = metadataFile[0];
        response.push(objectMetadata);
    }
    res.json({"dataFiles":response});
})

app.post('/getSomeFiles',bodyParser.json(),async (req,res)=>{
    let Ids = req.body.data;
    const archive = archiver('zip',{zlib: {level: 9}});
    res.set('Content-Type', 'zip');
    res.set('Content-Disposition', `attachment; filename="archivos.zip"`);
    for(let i = 0;i<Ids.length;i++){
        let idMongo =  new mongoDB.ObjectId(Ids[i]);
        let metadataFile = await gfs.find({"_id": idMongo}).toArray();
        let objectMetadata = metadataFile[0];
        let filename = objectMetadata.filename;
        let downloadStream = await gfs.openDownloadStream(idMongo);
        archive.append(downloadStream,{name:filename});
    }
    archive.finalize();
    archive.pipe(res);
});

app.post('/getPhotoDataset',bodyParser.json(),async (req,res)=>{
    let idDataset = req.body.data;
    let dataset = await findDataset(idDataset);
    let idPhoto = dataset.PhotoDataSet;
    console.log(idPhoto);
    let metadataFile = await gfs.find({"_id": idPhoto}).toArray();
    let objectMetadata = metadataFile[0];
    let downloadStream = await gfs.openDownloadStream(idPhoto);
    res.set('Content-Type',objectMetadata.contentType);
    res.set('Content-Disposition', `attachment; filename=${objectMetadata.filename}`);
    downloadStream.pipe(res);
})


app.post('/getPhotoUser',bodyParser.json(),async (req,res)=>{
    let idPhotoUser = req.body.photo;
    let idPhoto = new mongoDB.ObjectId(idPhotoUser);
    let metadataFile = await gfs.find({"_id": idPhoto}).toArray();
    let objectMetadata = metadataFile[0];
    let downloadStream = await gfs.openDownloadStream(idPhoto);
    res.set('Content-Type',objectMetadata.contentType);
    res.set('Content-Disposition', `attachment; filename=${objectMetadata.filename}`);
    downloadStream.pipe(res);

})

/* Conversations */

app.post('/createConversation',bodyParser.json(),async (req,res)=>{
    let idUser1 = req.body.actualUser;
    let idUser2 = req.body.otherUser;

    let conversation = await createConversation(idUser1,idUser2);

    res.json({"res" : conversation});    
})

app.post('/getConversationsOfUser',bodyParser.json(),async (req,res)=>{
    let idUser = req.body.idUser;
    

    let conversations = new Map();
    conversations = await consultConversationsOfUser(idUser);
    res.json({"conver" : conversations});
})

/* Messages */


app.post('/createMessage',bodyParser.json(),async (req,res)=>{
    let idAuthorUser = req.body.user;
    let idConversation = req.body.idConver;
    let content = req.body.content;
    let idFile = req.body.idFile;


    let message = await createMessage(idConversation,idAuthorUser,content,idFile);

    res.json({"message" : message});
})

app.post('/getMessagesConversation',bodyParser.json(),async (req,res)=>{
    let idConversation = req.body.conversation;

    messages = await loadMessages(idConversation);
    console.log(messages);

    res.json({"messages" : messages});

})

/* Comments Dataset */
app.post("/createComment",bodyParser.json(), async (req,res)=>{
    let p_idUser = req.body.idUser;
    let p_photo = req.body.photo;
    let p_idCommentResponse = req.body.idCommentResponse;
    let p_idDataset = req.body.idDataset;
    let p_creationDate = req.body.creationDate;
    let p_content = req.body.content;
    let p_file = req.body.file;

    let queryCreate = `INSERT INTO comment (idUser,photoUser, idCommentResponse, idDataset, creationDate, content, file) VALUES("${p_idUser}", "${p_photo}" ,${p_idCommentResponse}, "${p_idDataset}" , CONVERT_TZ(now(),  '+00:00', '-06:00') , "${p_content}", "${p_file}");`;

    connection.query(queryCreate, function (err, result){
        if(err) throw err;
        res.json({"idComment": result.insertId, "content": p_content})
    });
})


app.post("/getDatasetComments",bodyParser.json(), async (req,res)=>{
    let datasetId = req.body.datasetId;
    let queryGet = `SELECT * FROM comment where idDataset = "${datasetId}";`;
    connection.query(queryGet, function (err, result){
        if (err) throw err;
        res.json({"commentList" : Object.assign(result)});
    });
})


app.post('/getInfoDataset',bodyParser.json(),async (req,res)=>{
    let idDataset = new mongoDB.ObjectId(req.body.data);
    let dataset = await findDataset(idDataset);
    let name = dataset.name;
    let description = dataset.description;
    let date = dataset.DateOfInsert;
    res.json({"name": name, "description": description,
    "dateOfInsert": date});
});

app.post('/getDownloadedUsers',bodyParser.json(),async(req,res)=>{
    let idDataset = req.body.data
    let users =  await downloadedUserDataset(idDataset);
    res.json({"users":users});
})

app.post('/addUserDownload',bodyParser.json(),async (req,res)=>{
    let idDataset = req.body.data;
    let idUser = req.body.user;
    let response = await downloadDataset(idUser,idDataset);
    res.json({"answer": true});
})

app.post("/encryptPasswordRegister",bodyParser.json(),(req,res)=>{
    let unencryptedPassword = req.body.pass;
    let encryptedPassword = encryptPassword(unencryptedPassword);
    res.json({"encrypted":encryptedPassword});
})

app.post('/insertUser',bodyParser.json(), async (req,res)=>{
    let firstName = req.body.name;
    let firstSurname = req.body.lastName;
    let username = req.body.username;
    let photo = new mongoDB.ObjectId(req.body.photo);
    let password = req.body.password;
    let birthDate = req.body.birthday;
    let user =  await createUserMongo(username,password,firstName,firstSurname,birthDate,photo);
    let responseUser = await findUserById(user.insertedId);
    let idNeo4j = user.insertedId.toString();
    let writeNeo4j = await createUser(idNeo4j,username);
    res.json({"user":responseUser});
})

app.post("/getUsers",async (req,res)=>{
    let users = await searchAllUsers();
    res.json({"answer":users});
})

app.post('/uploadUserPhoto',upload.single('photoUser'), (req,res)=> {
    let idPhoto = req.file.id;
    res.json({"idPhoto":idPhoto});
});

app.post('/getFollowedUsers',bodyParser.json(),async (req,res)=>{
    let idUser = req.body.user;
    let users = await getFollowedUsers(idUser);
    res.json({"users":users});
})

app.post('/getFollowingUsers',bodyParser.json(),async (req,res)=>{
    let idUser = req.body.user;
    let users = await getFollowingUsers(idUser);
    res.json({"users":users});
})

app.post('/updatePasswordUser',bodyParser.json(),async (req,res)=>{
    let update = await  updatePasswordMongo(req.body.username,req.body.pass);
    res.json({"result": update});
})

app.post('/updateNameUser',bodyParser.json(),async (req,res)=>{
    let update = await  updateNameMongo(req.body.username,req.body.name);
    res.json({"result": update});
})

app.post('/updateLastNameUser',bodyParser.json(),async (req,res)=>{
    let update = await  updateLastNameMongo(req.body.username,req.body.lastName);
    res.json({"result": update});
})

app.post('/updatePhotoIdUser',bodyParser.json(),async (req,res)=>{
    let idPhoto = req.body.photo;
    let username =  req.body.username;
    let response = await updatePhotoMongo(username,idPhoto);
    res.json({"result":response});
})

app.post('/usersSearch',bodyParser.json(),async (req,res)=>{
    let query = req.body.query;
    let response = await searchUsernames(query);
    res.json({"result":response});

})

app.post('/getLikesDataset',bodyParser.json(),async (req,res)=>{
    let idDataset = req.body.data;
    let response  = await getLikesDataset(idDataset);
    console.log(response);
    res.json({"result":response});
})

app.post('/nameDatasetSearch',bodyParser.json(), async (req,res)=>{
    let query = req.body.query;
    let response = await searchAllDataSetByName(query);
    res.json({"result":response});
})

app.post('/descriptionDatasetSearch',bodyParser.json(),async (req,res)=>{
    let query = req.body.query;
    let response = await searchAllDataSetByDescription(query);
    res.json({"result":response});
})

app.post('/getUserLikedDatasets',bodyParser.json(),async(req,res)=>{
    let idUser = req.body.user;
    let response = await getLikedDatasets(idUser);
    res.json({"result":response});
})

app.post('/deleteUserLike',bodyParser.json(),async(req,res)=>{
    let idUser = req.body.user;
    let idDataset = req.body.dataset;
    await deleteUserLike(idUser,idDataset);
    res.json({"result": true});
})

app.post('/addUserLike',bodyParser.json(),async (req,res)=>{
    let idUser = req.body.user;
    let idDataset = req.body.dataset;
    await addUserLike(idUser,idDataset);
    res.json({"result":true});
})

app.post('/addUserFollow',bodyParser.json(),async (req,res)=>{
    let idUserFollows = req.body.follows;
    let idUserFollowed = req.body.followed;
    await addUserFollow(idUserFollows,idUserFollowed);
    res.json({"result":true});
})

app.post('/deleteUserFollow',bodyParser.json(),async (req,res)=>{
    let idUserFollows = req.body.follows;
    let idUserFollowed = req.body.followed;
    await deleteUserFollow(idUserFollows,idUserFollowed);
    res.json({"result":true});
})

console.log(encryptPassword('hola'));
// # # # # # # # END VALUES # # # # # # #

let id;


app.post('/upload',upload.array('file'),(req,res)=>{
    const files = req.files;
    console.log(req.body);
    const Ids = [];
    files.forEach(element => {
        console.log(element.id);
        Ids.push(element.id);
    });
    mongoose.connect(URI);
    Dataset.create({name: "pruebaDataset",
    description: "Para probar",
    archivosDataset: Ids,
    });
    res.json({body: req.body});
});




//Funciona
app.get('/dataset/:id',async function(req,res){
    //IMPORTANTE
    // id = ObjectID
    // El id de la direccion tiene que pasarse a string con ObjectId.toString() antes
    // de ponerselo a la URL-> /dataset/:id
    mongoose.connect(URI);
    let idDataset = new mongoDB.ObjectId(req.params.id);
    console.log(idDataset);
    const dataset = await findDataset(idDataset);
    console.log(dataset);
    console.log('Hola');
    //Por aqui iria la llamada al metodo de mongo que busca el Dataset
    let Idsfiles = dataset.archivosDataset;
    const archive = archiver('zip',{zlib: {level: 9}});
    res.set('Content-Type', 'zip');
    res.set('Content-Disposition', `attachment; filename=${dataset.name}.zip; returnUrl=${encodeURIComponent(req.query.returnUrl)}`);
    for(let i = 0;i<Idsfiles.length;i++){
        let metadataFile = await gfs.find({"_id": Idsfiles[i]}).toArray();
        let objectMetadata = metadataFile[0];
        let filename = objectMetadata.filename;
        let downloadStream = await gfs.openDownloadStream(Idsfiles[i]);
        archive.append(downloadStream,{name:filename});
    }
    archive.finalize();
    archive.pipe(res);
});

app.post("/datasets",bodyParser.json(),async function (req,res){
    let request = await getUploadedDatasets(req.body.data);
    res.json({"response": request});
})

app.post("/getObjectId",(req,res)=>{
    let id = mongoose.Types.ObjectId(req.body.data);
    res.json({"idDataset": id});
})


async function isUser(Users,username,password){
    let flag = false;
    let user;
    for(let i =0;i<Users.length;i++){
        let boolean = await bcrypt.compare(password,Users[i].password);
        if(username===Users[i].username&&boolean){
            flag = true;
            user = Users[i];
        }
    }

    return {isUser: flag, user:user};
}
function findDataset(idDataset){
    mongoose.connect(URI);
    const dataset = Dataset.findById(idDataset);
    return dataset;
}
//Querys MongoDB.
async function createUserMongo(username,password,firstName,firstSurname,birthDate,photoUser){
    let photo = new mongoDB.ObjectId(photoUser);
    let birthday = new Date(birthDate);
    let user = await conn.collection('users').insertOne(
        {
            username: username,
            password: password,
            firstName: firstName,
            firstSurname: firstSurname,
            birthDate: birthday,
            photo: photo,
        }
    )
    return user; 
}

async function createDataset(nameDataset,descriptionDataset,archivosDataset,
    photoDataSet){
    let objectIds = [];
    for(let i =0;i<archivosDataset.length;i++){
        objectIds.push(new mongoDB.ObjectId(archivosDataset[i]));
    }
    let photo = new mongoDB.ObjectId(photoDataSet)
    console.log(objectIds)
    let dataset = await conn.collection('datasets').insertOne({
        name: nameDataset,
        description: descriptionDataset,
        archivosDataset: objectIds,
        DateOfInsert: new Date(),
        PhotoDataSet: photo
    })
    return dataset.insertedId;
}


// Busca solo 1 elemento.
async function findUserById(idUser){
    let idSearch = new mongoDB.ObjectId(idUser);
    let userdb = await conn.collection('users').find({_id:idSearch})
    let response = await userdb.toArray();
    return response;
}


// Traerá solo 1, aunque hayan con más archivos con el mismo nombre.
async function searchByOneUsername(username){
    let userdb = await conn.collection('users').findOne({
        username: {$eq: username}
    })

    let response = await userdb.toArray();

    return response;
}



//Actualiza la contra en MongoDB
async function updatePasswordMongo(username,password){
    let result = await conn.collection('users').updateOne({username: username},{$set: {password: password}});
    return result;
}

//Actualiza el nombre en MongoDB
async function updateNameMongo(username,name){
    let result = await conn.collection('users').updateOne({username: username},{$set: {firstName: name}});
    return result;
}

//Actualiza la contra en MongoDB
async function updateLastNameMongo(username,lastName){
    let result = await conn.collection('users').updateOne({username: username},{$set: {firstSurname: lastName}});
    return result;
}

//Actualiza la contra en MongoDB
async function updatePhotoMongo(username,idPhoto){
    let idUpdate = new mongoDB.ObjectId(idPhoto);
    let result = await conn.collection('users').updateOne({username: username},{$set: {photo: idUpdate}});
    return result;
}


// Busca todos los usuarios con el mismo nombre.
async function searchAllUsersEqualsName(name){
    let userdb = await conn.collection('users').find({
        FirstName: {
            $eq: name
        }
    })

    let response = await userdb.toArray();

    return response;
}

// Busca todos los usuarios con el mismo apellido.
async function searchAllUsersEqualsSurname(firstSurname){
    const userdb = await conn.collection('users').find({
        FirstSurname: {
            $eq: firstSurname
        }
    })

    let response = await userdb.toArray();

    return response;
}


// Busca solo 1 elemento.
async function searchDataSetById(datasetId){
    mongoose.connect(URI);
    const dataset = Dataset.findById(datasetId);
    return dataset;
}

// Busca todos por ese atributo en el documento.
// Ejemplo si hay 3 documentos que tienen el nombre: Ardilla, los traerá.
async function searchAllDataSetByName (criterio){
  let regex = new RegExp(criterio.split(" ").join("|"), "i");
  let datasetdb = await conn.collection('datasets').find({
    name: {
      $regex: regex
    }
  });
  let response = await datasetdb.toArray();
  return response;
}

async function searchUsernames(username){
    let regex = new RegExp(username.split(" ").join(".+"), "i");
    let userdb = await conn.collection('users').find({
     username: {
       $regex: regex
     }
   });
   let response = await userdb.toArray();
   console.log(response);
   return response;
 }




// Busca todos por ese atributo en el documento.
// Ejemplo si hay 3 documentos que tienen el nombre: Ardilla, los traerá.
async function searchAllDataSetByDescription(description){
    let regex = new RegExp(description.split(" ").join("|"), "i");
    let datasetdb = await conn.collection('datasets').find({
      description: {
        $regex: regex
      }
    });
    let response = await datasetdb.toArray();
    return response;
}


// Busca todos por ese atributo en el documento.
// Ejemplo si hay 3 documentos que tienen el nombre: Ardilla, los traerá.
async function searchAllUsers(){
    let users = await conn.collection('users').find();
    let userList = await users.toArray();

    return userList;
}


//Encript password
function encryptPassword(password){
    const saltRounds = 10;
    var encrypted_password = bcrypt.hashSync(password, saltRounds);
    return encrypted_password;
  
}

async function createNotifications(notifiedUsers,userUploads,name){
    let submit = new mongoDB.ObjectId(userUploads);
    for(let i =0;i<notifiedUsers.length;i++){
        let notified = new mongoDB.ObjectId(notifiedUsers[i].id_mongo);
        let not = await conn.collection('notifications').insertOne({
            id_userSubmit: submit,
            id_userNotifier: notified,
            nameDataSet: name,
            dateNotifies: new Date()
        })
    }
}

//Algunos metodos de Neo4j.


async function createUser(User,username){
    const session = driver.session({database: 'neo4j'});
    try{
        const query = `CREATE (:User {id_mongo: ${User}, username: ${username}})`;
        await session.executeWrite(transaction => transaction.run(query));
    }catch(error){
        console.error(error);
    }finally{
        session.close();
    }
}
//Metodo que agrega una relacion de like entre un usuario y un dataset
//Agrega relacion en ambos sentidos con los puntos dados por el usuario.
async function addUserLike(User,Dataset){
    console.log(User);
    console.log(Dataset);
    console.log("Addlike");
    const session = driver.session({database: 'neo4j'});
    try{
        const query = `MATCH (us:User {id_mongo: "${User}"}),(dat:Dataset {id_mongo: "${Dataset}"}) 
        MERGE (us)-[:LIKES {points: ${1}}]->(dat)-[:LIKED_BY {points: ${1}}]->(us)`;
        await session.executeWrite(transaction => transaction.run(query));
    }catch(error){
        console.error(error);
    }finally{
        session.close();
    }
}

async function deleteUserLike(User,Dataset){
    console.log(User);
    console.log(Dataset);
    const session = driver.session({database: 'neo4j'});
    try{
        const query= `Match (us:User {id_mongo: "${User}"})-[rel:LIKES]->(dat:Dataset {id_mongo: "${Dataset}"})-[relTwo:LIKED_BY]->(us:User {id_mongo: "${User}"})
        DELETE rel,relTwo`
        await session.executeWrite(transaction=>transaction.run(query));
    }catch(error){
        console.error(error);
    }finally{
        session.close();
    }
}

//Funcion que crea una relacion de FOLLOW y FOLLOWED BY entre dos nodos.
async function addUserFollow(UserOne,UserTwo){
    console.log(UserOne);
    console.log(UserTwo);
    console.log("Add");
    const session = driver.session({database: 'neo4j'});
    try{
        const query = `MATCH (follow: User {id_mongo: "${UserOne}"}), (followed: User {id_mongo: "${UserTwo}"}) MERGE (follow)-[:FOLLOWS]->(followed)-[:FOLLOWED_BY]->(follow)`
        await session.executeWrite(transaction => transaction.run(query));
    }catch(error){
        console.error(error);
    }finally{
        session.close();
    }
}

//Elimina una relacion en ambos sentidos de seguimiento entre usuarios.
async function deleteUserFollow(UserOne, UserTwo){
    console.log(UserOne);
    console.log(UserTwo);
    console.log("Delete")
    const session = driver.session({database: 'neo4j'});
    try{
        const firstPartQuery = `MATCH (follow: User {id_mongo: "${UserOne}"})-[rel:FOLLOWS]->(followed: User {id_mongo: "${UserTwo}"})
        DELETE rel`;
        await session.executeWrite(transaction => transaction.run(firstPartQuery));
        const secondPartQuery =  `MATCH (followed: User {id_mongo: "${UserTwo}"})-[rel:FOLLOWED_BY]->(follow: User {id_mongo: "${UserOne}"})
        DELETE rel`;
        await session.executeWrite(transaction=> transaction.run(secondPartQuery));
    }catch(error){
        console.error(error);
    }
}

//Agrega una relacion de UPLOAD de un dataset a un Usuario en particular.
async function userAddsDataset(User,Dataset,nameDataSet){
    const session  = driver.session({database: 'neo4j'});
    try{
        const query = `MATCH (us: User {id_mongo: "${User}"})
        MERGE (us)-[:UPLOADS]->(:Dataset {id_mongo: "${Dataset}",name: "${nameDataSet}"})-[:UPLOADED_BY]->(us)`;
        await session.executeWrite(transaction => transaction.run(query));

    }catch(error){
        console.error(error);
    }finally{
        session.close();
    }
}

//Elimina un nodo dataset y sus relaciones.
async function userDeletesDataset(Dataset){
    const session  = driver.session({database: 'neo4j'});
    try{
        const query = `MATCH (data: Dataset {id_mongo: "${Dataset}"}) DETACH data DELETE data`;
        await session.executeWrite(transaction => transaction.run(query));
    }catch(error){
        console.error(error);
    }finally{
        session.close();
    }
}


//Elimina un Nodo Usuario, a su vez elimina los datasets que este pudiese haber subido
async function deleteUser(User){
    const session = driver.session({database: 'neo4j'});
    try{
        let query = `MATCH (n:Dataset)-[:UPLOADED_BY]->(us:User {id_mongo: "${User}"})
        DETACH n,us DELETE n,us`;
        await session.executeWrite(transaction=>transaction.run(query));
    }catch(error){
        console.log(error);
    }finally{
        session.close();
    }
}

//Crea una relacion de descarga entre el usuario y el dataset.
async function downloadDataset(User,Dataset){
    const session = driver.session({database: 'neo4j'});
    try{
        let query = `MATCH (us:User {id_mongo: "${User}"}),(dat:Dataset {id_mongo:"${Dataset}"})
        MERGE (us)-[:DOWNLOADS]->(dat)-[:DOWNLOADED_BY]->(us)`
        await session.executeWrite(transaction=>transaction.run(query));
    }catch(error){
        console.log(error)
    }finally{
        session.close();
    }
}

//Consultar usuarios que han descargado un dataset en particular
async function downloadedUserDataset(Dataset){
    const session = driver.session({database: 'neo4j'});
    //Se guardan los nodos de usuarios que han descargado el dataset
    //A partir de este se pueden consultar todos estos usuarios y cuantos son mediante el largo
    //de la lista.
    let users = [];
    try{
        let query = `MATCH (us:User)-[:DOWNLOADS]-(dat:Dataset {id_mongo:"${Dataset}"}) RETURN us`;
        const cursor = await session.executeRead(transaction=>transaction.run(query));
        cursor.records.forEach((element)=>{
            let node = element._fields[0].properties;
            users.push(node);
        });
        return users;
    }catch(error){
        console.log(error);
    }finally{
        session.close();
    }
}

//Trae todos los nodos de Dataset que hayan sido likeados por el usuario.
async function getLikedDatasets(User){
    const session = driver.session({database: 'neo4j'});
    let likedDatasets = [];
    try{
        let query = `MATCH (n:Dataset)-[:LIKED_BY]->(us:User {id_mongo: "${User}"}) RETURN n`;
        const cursor = await session.executeRead(transaction=>transaction.run(query));
        cursor.records.forEach((element)=>{
            let node = element._fields[0].properties;
            likedDatasets.push(node);
        })
        return likedDatasets;
    }catch(error){
        console.log(error);
    }finally{
        session.close();
    }
}

//Esta funcion retorna todos los Usuarios a los que sigue el usuario de entrada
//Para implementar en dos funcionalidades: Traer los datos de los usuarios que sigue el usuario
//logeado y presentarlos, O si un usuario sube un dataset, se le notifica a los demas a partir del
//arreglo
async function getFollowedUsers(User){
    const session = driver.session({database: 'neo4j'});
    let followedUsers = [];
    try{
        let query = `MATCH (us:User)-[:FOLLOWED_BY]->(entry:User {id_mongo: "${User}"}) RETURN us`;
        const cursor = await session.executeRead(transaction=>transaction.run(query));
        cursor.records.forEach((element)=>{
            let node = element._fields[0].properties;
            followedUsers.push(node);
        })
        return followedUsers;
    }catch(error){
        console.log(error);
    }finally{
        session.close();
    }
}

//Devuelve todos los usuarios que siguen al usuario de entrada
async function getFollowingUsers(User){
    const session = driver.session({database: 'neo4j'});
    let followedUsers = [];
    try{
        let query = `MATCH (us:User)-[:FOLLOWS]->(entry:User {id_mongo: "${User}"}) RETURN us`;
        const cursor = await session.executeRead(transaction=>transaction.run(query));
        cursor.records.forEach((element)=>{
            let node = element._fields[0].properties;
            followedUsers.push(node);
        })
        return followedUsers;
    }catch(error){
        console.log(error);
    }finally{
        session.close();
    }
}


//Funcion que retorna todos los datasets subidos por un usuario en particular.
async function getUploadedDatasets(User){
    const session = driver.session({database: 'neo4j'});
    let dataSets = [];
    try{
        let query = `MATCH (dat:Dataset)-[:UPLOADED_BY]->(us:User {id_mongo:"${User}"}) RETURN dat`;
        const cursor = await session.executeRead(transaction=>transaction.run(query));
        cursor.records.forEach((element)=>{
            let node = element._fields[0].properties;
            dataSets.push(node);
        })
        return dataSets;
    }catch(error){
        console.log(error);
    }finally{
        session.close();
    }
}

//Devuelve la cantidad de likes de un dataset
async function getLikesDataset(dataset){
    const session = driver.session({database: 'neo4j'});
    let users = [];
    try{
        let query = `MATCH (us:User)-[:LIKES]->(dat:Dataset {id_mongo:"${dataset}"}) RETURN us`;
        const cursor = await session.executeRead(transaction=>transaction.run(query));
        cursor.records.forEach((element)=>{
            let node = element._fields[0].properties;
            users.push(node);
        })
        console.log(users);
        return users;
    }catch(error){
        console.log(error);
    }finally{
        session.close();
    }
}


/*
  Function that creates a conversation between two users and verifies that it is not created.
*/
async function createConversation(idUser1,idUser2){
  if(idUser1 != idUser2){
    let x = await redisDB.keys('*');
    let isCreate = false;
    let idExistConversation = '';
    
    for(let i = 0; i < x.length;i++){
      let keyName = x[i];
      if (keyName.substring(0,3) == 'con'){
        
        let u1 = await redisDB.hget(x[i],'user1');
        let u2 = await redisDB.hget(x[i],'user2');
      
        if((u1 == idUser1 && u2 == idUser2) || (u1 == idUser2 && u2 == idUser1)){
          isCreate = true;
          idExistConversation = x[i];
          break;
        }
      }   
    }
  
  
    if(isCreate == false){
      let i = 0;
      let name = 'con-';
  
      while(await redisDB.exists(name+i) == true){
          i += 1;
      }
      name = name + i;
      await redisDB.hmset(name,'user1',idUser1,'user2', idUser2);
      return {isCreate: isCreate, nameConversation : name};
    }
    else{
        return {isCreate: isCreate, nameConversation : idExistConversation};
    }
  }
}

/* 
Function that creates a message in a conversation with a specified id 
*/
async function createMessage(conversation,idAuthor,content,file){
  let name = 'mes-' + conversation + '-';
  let message = {};
  let i = 0;

  while(await redisDB.exists(name+i) == true){
    i += 1;
  }
  name = name + i;

  message.conver = conversation;
  message.name = name;
  message.idAuthor = idAuthor;
  message.content = content;
  message.file = file;
  
  await redisDB.hmset(name,'idAuthor',idAuthor,'content',content,'file',file);
  return message;
}

/*
Consult name to Conversation of two users
*/
async function consultConversation(idUser1, idUser2){
  let x = await redisDB.keys('*');
  let nameConversation = '';

  for(let i = 0; i < x.length;i++){
    let keyName = x[i];
    if (keyName.substring(0,3) == 'con'){
      let u1 = await redisDB.hget(x[i],'user1');
      let u2 = await redisDB.hget(x[i],'user2');
      if(u1 == idUser1 && u2 == idUser2){
        nameConversation = x[i];
        break;
      }   
    }
  }
  return nameConversation;
}

async function consultConversationsOfUser(idUser){
  let x = await redisDB.keys('*');
  let conversationsUser = {};


  for(let i = 0; i < x.length ; i++){
    let keyName = x[i];
    if (keyName.substring(0,3) == 'con'){
      let key = x[i];
      let u1 = await redisDB.hget(key,'user1');
      let u2 = await redisDB.hget(key,'user2');
      if(idUser == u1 || idUser == u2){
        conversationsUser[key] = {"user1": u1, "user2": u2};
      }
    }
  }
  return conversationsUser;
}

async function loadMessages(idConversation){
    let messages = {};
    
    let keyName = 'mes-' + idConversation + '-';
    let i = 0;
    let x = await redisDB.hvals(keyName + i);

    while(x.length != 0){
      let x1 = await redisDB.hget(keyName+i,"idAuthor");
      let x2 = await redisDB.hget(keyName+i,"content");
      let x3 = await redisDB.hget(keyName+i,"file");

      messages[i] = {"idAuthor": x1, "content": x2, "file": x3};
      i ++;
      x = await redisDB.hvals(keyName + i);
    }

    return messages;

    /*mapMessages.set(0,{'idAuthor': '1234','content':'Hola'});
    let mapMessage = mapMessages.get(0);
    console.log(mapMessage['hola']);*/

}