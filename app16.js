const mysql = require("mysql2");
const express = require("express");
const session = require('express-session');
const port = process.env.PORT || 8080;
var customer = {id: NaN, name: '', family: '', email: '', password: ''};
var key = false, keys = false;
 
const connection = mysql.createConnection({
    host: "remotemysql.com",
    user: "rFnAPuHZXv",
    password: "fFibUtbJiV"
  });
   
  // Создание базы данных
  connection.query("CREATE DATABASE IF NOT EXISTS rFnAPuHZXv",
    function(err, results) {
      if(err) console.log(err);
      else console.log("База данных rFnAPuHZXv открыта.");    
  });
  
  connection.query("USE rFnAPuHZXv");
  
  // Создание таблицы
const sql1 = `create table if not exists customers(
      id int primary key auto_increment,
      name varchar(255) not null,
      family varchar(255) not null,
      email varchar(255) not null,
      password varchar(255) not null)`;
     
connection.query(sql1, function(err, results) {
    if(err) console.log(err);
    else console.log("Таблица customers создана.");
});

connection.query("DELETE FROM customers WHERE name='Admin' OR id=1");

const sql2 = "INSERT INTO customers(id, name, family, email, password) VALUES(1, 'Admin', 'Ghoncharow', 'nio7@list.ru', '12345')";
 
connection.query(sql2, function(err, results) {
    if(err) console.log(err);
    else console.log("Таблица customers инициализирована.");
});
  
const pool = mysql.createPool({
    connectionLimit: 50,
    host: "remotemysql.com",
    user: "rFnAPuHZXv",
    database: "rFnAPuHZXv",
    password: "fFibUtbJiV"
});

// функция промежуточной обработки для предоставления статических файлов
const app = express();
app.use(express.static('assets'));

// создаем парсер для данных в формате json
const jsonParser = express.json();

app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true
}));
// Authentication and Authorization Middleware
var auth = function(req, res, next) {
    if (req.session && req.session.user === "amy" && req.session.admin) return next(); 
    else res.redirect("/");
};


// проходим процедуру авторизации
app.post("/registration", jsonParser, function (req, res) {         
    if(!req.body) return res.sendStatus(400);
    const name = req.body.name;
    const family = req.body.family;
    const email = req.body.email;
    const password = req.body.password;   

    pool.query("SELECT * FROM customers WHERE email=? AND password=?", [email, password], function(err, data) {
      if(err) return console.log(err);
      customer = data[0];        
    });        
    setTimeout(()=>{ if (!customer)
        pool.query("INSERT INTO customers (name, family, email, password) VALUES (?,?,?,?)", [name, family, email, password], function(err, data) {
        if(err) return console.log(err);
        console.log(data);
        });        
    }, 500); 
});

// заходим в админку
app.get('/login', function (req, res) {
    setTimeout(()=>{
        if (keys) {
            req.session.user = "amy";
            req.session.admin = true; 
            keys = false; 
        }
        res.redirect("/content");
    }, 500);    
});

// получаем данные от клиента
app.post("/login", jsonParser, function (req, res) {         
    if(!req.body) return res.sendStatus(400);
    const email = '' + req.body.email;
    const password = '' + req.body.password;
    pool.query("SELECT * FROM customers WHERE email=? AND password=?", [email, password], function(err, data) {
      if(err) return console.log(err);
      if (data[0]) { 
        if (data[0].name == 'Admin') key = true;
        keys = true;
      }  
    });     
});

// выход из админки для юзера
app.post("/logout", jsonParser, function (req, res) {         
    if(!req.body) return res.sendStatus(400);
    req.session.destroy();
    res.redirect("/");
});

// Get content endpoint
app.get('/content', auth, function (req, res) {
    // You can only see this after you've logged in
    res.sendFile(__dirname + "/index.html");   
});

// выход из админки для владельца
app.use("/quit",function (req, res) { 
    if (key) {   
    req.session.destroy();
    key = false;
    connection.end();
    pool.end();
    console.log('Application is closing...');
    app.close;
    process.exit(0);
    } else res.redirect("/");
});
// постоянная переадресация
app.use("/:id",function (request, response) {
    const id = request.params.id;
    if (id=='registration') response.sendFile(__dirname + "/register_v3.html");
    else if (id=='error404') response.sendFile(__dirname + "/extra_404_error.html");
    else if (id!='') response.redirect("/");
});

// загрузка фронтенда в браузер
app.get("/", function(request, response){    
    response.sendFile(__dirname + "/login_v3.html");     
});
  
app.listen(port, ()=>{console.log(`Сервер запущен по адресу http://localhost:${port}.`);});