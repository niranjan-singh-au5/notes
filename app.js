var express = require('express')
var bodyParser = require('body-parser')
var hbs = require('hbs')
var mongodb = require('mongodb')
var multiparty = require('multiparty')
var session = require('express-session')
var cloudinary = require('cloudinary')


var app = express()
app.use(express.static('public'))
app.use(express.static('uploads'))

app.use(bodyParser.urlencoded({
    extended: false
}))

app.set('view engine', 'hbs')

var url = "mongodb+srv://niranjan12:niranjan12@cluster0-4bdxx.mongodb.net/notes?retryWrites=true&w=majority"
var dbname = 'notes'
var DB =''
mongodb.MongoClient.connect(url, { useUnifiedTopology: true }, function (err, client) {
    if(err){
        console.log('Failed to connect to mongodb. Error:', err)
    }
    else{
        DB = client.db(dbname)
    }
})

app.use(session({
    secret: 'qwertyuiop',
    cookie: { 
        maxAge: 1000 * 60 * 60,
        path: '/',
        httpOnly: true

    }
}))




app.get('/signup', function (req, res) {
    res.render('signup')
})


app.post('/userlogin', function (req, res) {
   
    DB.collection('users').findOne({email: req.body.email}, function(err, result){
        console.log(result)
        if(result == null){
            res.redirect('/?nouser=true')
        }
        else{
            if(req.body.password == result.password){
                req.session.user = {
                    email: req.body.email
                }
                console.log(req.session.user)
                res.redirect('/home')
            }
            else{
                res.redirect('/?incorrectpassword=true')
            }
        }
    })
        
})

app.post('/usersignup', function (req, res) {
    DB.collection('users').findOne({email: req.body.email}, function (err, result){
        if(result == null){
            var data = {
                name: req.body.name,
                lastname: req.body.lastname,
                email: req.body.email,
                phone: req.body.phone,
                password: req.body.password
            }
            DB.collection('users').insertOne(data, function(err, result){
                if(err){
                    console.log('Error Signing up:', err)
                }
                else{
                    res.redirect('/')
                }
            })
        }
        else{
            res.redirect('/signup?alreadyexists=true')
        }
    })

})


app.get('/', function (req, res) {
    res.render('login')
})


////////////////////////// SESSION //////////////////////////////
app.use(function (req, res, next){
    if(req.session.user){
        next();
    }
    else{
        res.redirect('/?loginfirst=true')
    }
})



var fetchnotes 
app.get('/home', function (req, res) {
    DB.collection('users').findOne({email: req.session.user.email}, function(err, email){
        if(err){
            console.log(err)
        }
        else{
            DB.collection('notes').find({email: email.email}).toArray(function (err, notes){
                fetchnotes = notes
                res.render('home', {
                    email: email, 
                    notes: notes 
                })
            })
        }
    })
    
})


app.post('/addnote', function (req, res){
    var form = new multiparty.Form({uploadDir:'uploads'})
    form.parse(req, function(err, fields, files){
        var pic = files.photo[0]
        var data ={
            email: req.session.user.email
        }
        if (fields.title[0] != ""){
            data.title = fields.title[0]
        }
        if (fields.desc[0] != ""){
            data.desc = fields.desc[0]
        }
        if(pic.size != 0) {
            data.photo = pic.path.replace('uploads\\','')
        }
        DB.collection('notes').insertOne(data, function(err, result){
            res.redirect('/home?addednote=true')
        })
    })
})

app.post('/updatenote', function (req, res) {
    var form = new multiparty.Form({ uploadDir: 'uploads'})
    form.parse(req, function(err, fields, files){
        var id = mongodb.ObjectID(fields._id[0]) 
        var pic = files.photo[0]
        var data ={}

        if (fields.title[0] != ""){
            data.title = fields.title[0]
        }
        if (fields.desc[0] != ""){
            data.desc = fields.desc[0]
        }
        if(pic.size != 0) {
            data.photo = pic.path.replace('uploads\\','')
        }
        DB.collection('notes').updateOne({_id: id }, {$set: data}, function(err, result){
            if(err){
                console.log(err)
            }
            else{
                res.redirect('/home?updated=true')
            }
        })
    })
})

app.delete('/deletenote', function (req, res){
        var id  = mongodb.ObjectID(req.body.deleteid)
        DB.collection('notes').deleteOne({_id: id}, function(err,result){
            if(err){
                console.log(err)
            }
            else{
                res.send('deleted')
            }
        })
})

app.get('/logout', function (req, res){
    req.session.destroy()
    res.redirect('/')
})



app.listen(process.env.PORT || 4500)

