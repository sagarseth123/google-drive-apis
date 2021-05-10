require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const fs = require('fs');
const multer = require("multer");

var name;


const { google } = require("googleapis");
const app = express();





app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');




const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.refresh_token;

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
});


app.get("/", function(req, res) {
    res.render('upload.ejs');
});


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/")
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    },
})

const uploadStorage = multer({ storage: storage })





async function generatelink(fileid) {
    console.log("here we are");
    try {
        await drive.permissions.create({
            fileId: fileid,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });
        const result = await drive.files.get({
            fileId: fileid,
            fields: 'webViewLink,webContentLink'
        });
        var link = "https://drive.google.com/thumbnail?id=" + fileid.toString();
        console.log(link);
        return link;
    } catch (error) {
        console.log(error.message);
    }

}



async function uploadFile(myimage) {
    try {
        const response = await drive.files.create({
            requestBody: {
                name: myimage.originalname,
                mimeType: myimage.mimetype
            },
            media: {
                mimeType: myimage.mimetype,
                body: fs.createReadStream(myimage.path)
            }
        });
        console.log(response.data);
        var link = await generatelink(response.data.id);
        console.log(link);
        return link;
    } catch (error) {
        console.log(error.message);
    }

}

app.post("/image", uploadStorage.array('image', 2), (req, res) => {
    if (!req.files) {
        console.log("no file");
    } else {
        if (req.files[0].originalname < req.files[1].originalname) {
            var question = req.files[0];
            var answer = req.files[1];
        } else {
            var question = req.files[1];
            var answer = req.files[0];
        }


        async function insert() {
            var qlink = await uploadFile(question);
            console.log(qlink);
            var alink = await uploadFile(answer);
            console.log(alink);
            fs.unlinkSync(question.path);
            fs.unlinkSync(answer.path);
            res.json({
                question: qlink,
                answer: alink
            });
        }
        insert();
    }
});


//abhi tk ab thik thak

console.log("working");

const port = process.env.PORT || 3000;

app.listen(port, function(req, res) {
    console.log("server is set on port 3000");
});