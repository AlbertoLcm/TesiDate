const express = require('express');
const http = require('http');
const multer = require('multer');
const cors = require('cors');
const math = require('mathjs');

// Modulos para la autenticacion de usuario
const { json, render } = require('express/lib/response');
const hbs = require('hbs');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const PassportLocal = require('passport-local').Strategy;

require('dotenv').config();

const app = express();
const server = http.createServer(app)
const socketio = require('socket.io')(server);



app.use(cors());
const port = process.env.PORT;

const conexion = require('./database/db.js');

//handlebars
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials');

// Middlewers
// Lectura y parseo del body 
app.use(express.urlencoded({extended:true}));
app.use(express(json))

app.use(express.static('public'));

// Todo es de la configuracion para la sesion
app.use(cookieParser('secreto12'));
// app.set('trust proxy', 1);
app.use(session({
    // cookie:{
    //     secure: true
    //        },
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
    app.locals.user = req.user;
    next();
  });


passport.use(new PassportLocal((username, password, done) => {
    conexion.query('SELECT * FROM usuarios WHERE correo = ? AND password = ?',[username, password], (error, usuario) => {
        try {
            if(username === usuario[0].correo && password === usuario[0].password){
                console.log("Sesion Iniciada", {id:usuario[0].matricula, name:usuario[0].nombre});
                return done(null, {id:usuario[0].matricula, name:usuario[0].nombre, foto:usuario[0].foto});
            }
        } catch (error) {
            console.log('Usuario o contraseña inconrrecto');
            done(null, false);
        }
    });
    
}));

passport.serializeUser((usuario, done) => {
    done(null, usuario.id);
})

//deserializacion 
passport.deserializeUser((id, done) => {
    conexion.query('SELECT * FROM usuarios WHERE matricula = ?', [id], (error, usuario) => {
        if(error) throw error;
        done(null, {id:usuario[0].matricula, name:usuario[0].nombre, foto:usuario[0].foto});
    });
})

app.get('/', (req, res, next)=>{
    if(!req.isAuthenticated()) return next();

    res.redirect('/principal');
}, (req, res) => {
    res.render('login');
}); 


app.post('/', passport.authenticate('local',{
    successRedirect: '/principal',
    failureRedirect: '/',
    passReqToCallback: true
}));

// fin de la configuracion de la session

// aqui comienzan los routers 

// peticiones GET
app.get('/principal', (req, res, next)=>{
    if(req.isAuthenticated()) return next();

    res.redirect('/');
}, (req, res) => {

    const id = req.user.id;
    let usuariosMatchs = [];

    conexion.query('SELECT * FROM usuarios RIGHT JOIN matchs ON matchs.matricula_match = usuarios.matricula where matchs.matricula_user = ?', [req.user.id], (error, usuarios) => {
        const usuariosArray = Object.keys(usuarios).map((key) => {
            return [Number(key), usuarios[key]];
        });
        usuariosArray.forEach((user, iterable) => {
            usuariosMatchs.push(usuarios[iterable].matricula_match);
        });
        console.log(usuariosMatchs)
    });
    
    conexion.query("SELECT * FROM usuarios WHERE matricula != ?", [id], (error, usuarios) => {
        const usuariosArray = Object.keys(usuarios).map((key) => {
            return [Number(key), usuarios[key]];
        })
        const numeroMax = usuariosArray.length;
        const numRamdom = parseInt(math.random(numeroMax));
        
        if(usuariosMatchs.includes(usuarios[numRamdom].matricula)){
            res.redirect('/principal');
        }else{
            res.render('principal', usuarios[numRamdom]);
        }
        
    });
});

app.get('/chat/:id', (req, res, next)=>{
    if(req.isAuthenticated()) return next();

    res.redirect('/');
}, (req, res) => {

    const matricula = req.params.id;
    
    conexion.query('SELECT * FROM usuarios WHERE matricula = ?', [matricula], (error, usuarioUsuarios) => {

        conexion.query('SELECT * FROM chats WHERE matricula = ?', [matricula], (error, usuarioChats) => {
            if(usuarioChats[0] == undefined){
                console.log('no existe en los chats');
                conexion.query('INSERT INTO chats SET ?', {
                    nombre: usuarioUsuarios[0].nombre,
                    matricula: matricula
                });

                conexion.query('SELECT * FROM chats WHERE matricula = ?', [matricula], (error, usuario) => {
                    res.render('chat', usuario[0]);
                    console.log(usuario[0].nombre);
                });
            }else{
                res.render('chat', usuarioUsuarios[0]);
                console.log(usuarioUsuarios[0].nombre);
            }
        })
    } );

    // conexion.query('SELECT * FROM usuarios JOIN mensajes ON mensajes.matricula = usuarios.matricula where usuarios.matricula = ?', [matricula], (error, usuarios) => {
    //     // res.render('interes', {usuarios});
    //     console.log(usuarios);
    // });
    
});

app.get('/registrar', (req, res) => {
    res.render('registrar');
});

app.get('/interes', (req, res, next)=>{
    if(req.isAuthenticated()) return next();

    res.redirect('/');
}, (req, res) => {
    conexion.query('SELECT * FROM usuarios RIGHT JOIN matchs ON matchs.matricula_match = usuarios.matricula where matchs.matricula_user = ?', [req.user.id], (error, usuarios) => {
        res.render('interes', {usuarios});
    });
});

app.get('/mensajes', (req, res, next)=>{
    if(req.isAuthenticated()) return next();

    res.redirect('/');
}, (req, res) => {
    res.render('mensajes');
});

app.get('/perfil', (req, res, next)=>{
    if(req.isAuthenticated()) return next();

    res.redirect('/');
}, (req, res)=>{
    conexion.query("SELECT * FROM usuarios WHERE matricula = ?", [req.user.id], (error, usuario) => {
        res.render('perfil', usuario[0]);
    });
});

app.get('/add/:id', (req, res, next)=>{
    if(req.isAuthenticated()) return next();

    res.redirect('/');
}, (req, res) => {
    const id = req.params.id;

    conexion.query('INSERT INTO matchs SET ?', {
        matricula_user: req.user.id,
        matricula_match: id}, (error, usuario) => {
        if (error) throw error;
        console.log(`Match añadido ${usuario}`);
        res.redirect('/principal');
    });
});

app.get('/logout', (req, res, next) => {
    console.log('Sesion Cerrada', req.user)
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

app.get('/usuario/:id', (req, res, next)=>{
    if(req.isAuthenticated()) return next();

    res.redirect('/');
},(req, res) => {
    const id = req.params.id;

    conexion.query('SELECT * FROM usuarios WHERE matricula = ?', [id], (error, usuario) => {
        res.render('usuario', usuario[0]);
    } );
});

// peticiones POST

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './public/img');
    },
    filename: (req, file, callback) => {
        const ext = file.originalname.split('.').pop();
        const nomImg = `${Date.now()}.${ext}`;
        
        conexion.query('UPDATE usuarios SET ? WHERE matricula = ?', [{
            foto: `./img/${nomImg}`},
            req.user.id], (error, results) => {
        });
        
        callback(null, nomImg);
    }
});

const upload = multer({storage});

app.post('/upload', upload.single('imagen'), (req, res) => {
    res.redirect('/perfil');
});

app.post('/perfil/update', (req, res, next)=>{
    if(req.isAuthenticated()) return next();

    res.redirect('/');
}, (req, res) => {
    const {edad, telefono, facebook, descripcion, carrera, genero, nombre, apellidos} = req.body;

    conexion.query('UPDATE usuarios SET ? WHERE matricula = ?', [{
        edad: edad,
        telefono: telefono,
        facebook: facebook,
        descripcion: descripcion,
        carrera: carrera,
        genero: genero,
        nombre: nombre,
        apellidos: apellidos},
        req.user.id], (error, results) => {
        if (error) throw error;
        res.redirect('/perfil');
    });
});

app.post('/registrar', (req, res) => {
    const {matricula, nombre, apellidos, correo, password} = req.body;

    conexion.query('INSERT INTO usuarios SET ?', {
        matricula, matricula,
        nombre: nombre, 
        apellidos: apellidos, 
        correo: correo, 
        foto: './img/user.jpg',
        password: password}, (error, results) => {
        if (error) throw error;
        console.log("Usuario Registrado", {id:matricula, name:nombre});
        res.redirect('/');
    });
});

server.listen(port, () => {
    console.log(`Escuchando en http://localhost:${port}`);
});

// Sockets
const io = socketio.listen(server)

io.on('connection', socket => {
    console.log('usuario conectado');

    socket.on('send-message', mensaje => {
        io.sockets.emit(`new-message-${mensaje.receptor}-${mensaje.emisor}`, mensaje.mensaje);
        
        conexion.query('SELECT * FROM chats WHERE matricula = ?', [mensaje.receptor], (error, chat) => {
            conexion.query('INSERT INTO mensajes SET ?', {
                mensaje: mensaje.mensaje,
                id_chat: chat[0].id_chat
            });
        });
        
        console.log(mensaje);
    });
});1