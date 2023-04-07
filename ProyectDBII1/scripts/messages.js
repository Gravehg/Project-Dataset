const parameters = new URLSearchParams(window.location.search);
const actualUser = parameters.get("actualUser");
const otherUser = parameters.get("otherUser");
const conver = parameters.get("conver");
const appendTo = document.getElementById("messages");

async function createMessage(){
    const content = document.getElementById("txtContent").value;
    const file = document.getElementById("formFile").files[0];
    if(file&&content){
        const formData = new FormData();
        formData.append('file',file);
        const uploadFile = await fetch("/uploadMessageFile",{
            method: "POST",
            body: formData
        })
        let responseServer = await uploadFile.json();
        let idFile = responseServer.idFile;
        console.log(idFile);

        const response = await fetch('/createMessage',{
            method: "POST",
            body: JSON.stringify({user:actualUser,idConver:conver,content: content,idFile:idFile}),
            headers: {
                "Content-Type": "application/json",
            },
        })
    
        let responseObject = await response.json();
        let message = responseObject.message;
    }
    else if (file&&!content){
        const formData = new FormData();
        formData.append('file',file);
        const uploadFile = await fetch("/uploadMessageFile",{
            method: "POST",
            body: formData
        })
        let responseServer = await uploadFile.json();
        let idFile = responseServer.idFile;
        console.log(idFile);

        const response = await fetch('/createMessage',{
            method: "POST",
            body: JSON.stringify({user:actualUser,idConver:conver,content: null,idFile:idFile}),
            headers: {
                "Content-Type": "application/json",
            },
        })
    
        let responseObject = await response.json();
        let message = responseObject.message;
    }
    else{
        const response = await fetch('/createMessage',{
            method: "POST",
            body: JSON.stringify({user:actualUser,idConver:conver,content: content,idFile:null}),
            headers: {
                "Content-Type": "application/json",
            },
        })
    
        let responseObject = await response.json();
        let message = responseObject.message;
        //console.log(message);
    }
    loadMessages();
}


async function loadMessages () {
    //eliminar los mensajes actuales
    appendTo.innerHTML = ``;
    //Traer los mensajes de la base de datos
    const response = await fetch('/getMessagesConversation',{
        method: "POST",
        body: JSON.stringify({conversation: conver}),
        headers: {
            "Content-Type": "application/json",
        },
    })

    let responseObject = await response.json();
    let messages = responseObject.messages;
    let lenMessages = Object.keys(messages).length;

    console.log(lenMessages);

    for(let i = 0; i < lenMessages;i++ ){
        let mes = messages[i];
        if(mes["idAuthor"] == actualUser){
            createRightMessageBox(mes);
        }
        else{
            createLeftMessageBox(mes);
        }
    }

    await loadImageMessages();
}

async function createRightMessageBox(message){
    const divPrincipal = document.createElement('div');

    const content = message["content"];
    const idFile = message["file"];
    let fileDisplay = null;
    let displayContent = "block";
    let displayContentFile = "block";
    

    if(content == null){
        displayContent = "none";
    }

    if(idFile == null || "none"){
        displayContentFile = "none";
    }
    else{
        console.log(idFile);
        fileDisplay = await loadFile(idFile);
    }

    divPrincipal.classList = "col-12 d-flex flex-row justify-content-end";
    divPrincipal.innerHTML = `
    <div class="card bg-primary text-white d-flex flex-row mt-3" style="width: auto; height: auto; margin-right: 7vw;">
        <h5 style="margin-top: 0.8vw; margin-bottom: 0.8vw; margin-left: 0.5vw; margin-right: 0.5vw; display: ${displayContent};">${content}</h5>
        <img src=${fileDisplay} style="margin-top: 0.8vw; margin-bottom: 0.8vw; margin-left: 0.5vw; margin-right: 0.5vw;max-width: 10vw; display: ${displayContentFile}>
    </div>
    `
    appendTo.appendChild(divPrincipal);
}

async function loadFile(idFile){

    const response = await fetch('/getPhotoUser',{
        method: "POST",
        body: JSON.stringify({photo: idFile}),
        headers: {
            "Content-Type": "application/json",
        },
    })

    const blob = await response.blob();
    //console.log(blob);
    const url = URL.createObjectURL(blob);

    return url;
}

async function createLeftMessageBox(message){
    const divPrincipal = document.createElement('div');

    const content = message["content"];
    const file = message["file"];

    const displayContent = "block";
    const imageOtherUser = "../Images/Icons/noImage.jpg";

    if(content == "none"){
        displayContent = "none";
    }
    if(content == "none"){
        displayContent = "none";
    }

    divPrincipal.classList = "col-12 d-flex flex-row justify-content-start";
    divPrincipal.innerHTML = `
    <div class="card bg-light d-flex flex-row mt-3" style="width: auto; height: auto; margin-left: 7vw;">
        <div class="mx-2 mb-1 mt-2">
        <img name="photoUser" src=${imageOtherUser} style="height: 2vw; width: 2vw; border-radius: 50%;">
        </div>
        <h5 style="margin-top: 0.8vw; margin-bottom: 0.8vw; margin-left: 0.5vw; margin-right: 0.5vw;display: ${displayContent};">${content}</h5>
    </div>
    `
    appendTo.appendChild(divPrincipal);
}

async function loadImageMessages(){
    const idPhoto = await getOtherUser();
    console.log(idPhoto);

    const response = await fetch('/getPhotoUser',{
        method: "POST",
        body: JSON.stringify({photo: idPhoto}),
        headers: {
            "Content-Type": "application/json",
        },
    })

    const blob = await response.blob();
    console.log(blob);
    const url = URL.createObjectURL(blob);

    const photos = document.getElementsByName("photoUser");
    
    for(let i = 0; i< photos.length; i++){
        photos[i].src = url;
    }

}

async function getOtherUser(){
    const response = await fetch('/getUser',{
        method: "POST",
        body: JSON.stringify({idUser: otherUser}),
        headers: {
            "Content-Type": "application/json",
        },
    })
    let responseObject = await response.json();

    let user = responseObject.user;
    document.getElementById("username").innerHTML = user[0].username;

    return user[0].photo;
}



