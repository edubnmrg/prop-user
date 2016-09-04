var express=require(`express`);
var fs =require(`fs`);
var request=require(`request`);
var cheerio=require(`cheerio`);
var app=express();
var exphbs  = require('express-handlebars');
//var helpers = require('./lib/helpers');
var auth = require('basic-auth');
var cookieParser = require('cookie-parser');
var database = require('./database').instance;
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'sqlben',
  database : 'new_schema'
});


app.use(cookieParser());
app.use(express.static('./imagenes'));
app.use('/public',express.static('public'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var basicAuth = require('basic-auth');
VALID_USER = "AGENTE"
VALID_PASSWORD = "ORION"
var titulo, descripcion,precio,datos_arr,imagenes_arr
function cheer(res,agent,html){
  //console.log("cheers");

  var $ = cheerio.load(html);
  console.log("cheerio");

  titulo = $("h1").text()
  precio =$(".venta").text()
  descripcion =  $("#id-descipcion-aviso").text().trim()
  datos_arr=[];
  $(".aviso-datos ul li").each(function(i, elem){
    datos_arr.push({texto:$(elem).text()})
  });
  imagenes_arr=[];
  $(".rsMainSlideImage").each(function(i, elem){
    imagenes_arr.push({imagen:$(elem).attr("href")});
  });
  res.render('props',{titulo,precio,descripcion,datos_arr,imagenes_arr,agent});
};

var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(401);
  };

  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };

  if (user.name === VALID_USER && user.pass === VALID_PASSWORD) {
    return next();
  } else {
    return unauthorized(res);
  };
};
connection.connect(function(err){
  if(!err) {
    console.log("Conectado a Base de Datos ... nn");
  } else {
    console.log("Error conectando a Base de Datos ... nn");
  }
});
var hayrows=[];
app.get(`/`,auth,function(req,res){
  res.cookie("agente", true);
  var visitas=[];
  hayrows=[];
  new Promise(function(resolve,reject){connection.query("select * from consultas;",function(err, rows, fields){
    if(err){
      console.log(err);
    }else{
      //console.log("rowslength "+rows.length);
      if(rows.length==0){
        var novis=err;
        //console.log("reject");
        reject(novis);}
        else{
          for(var i = 0;i < rows.length;i++){
            hayrows.push(rows[i]);
            //console.log("elem "+rows[i].url);
          };
          //console.log("resolve");
          resolve(hayrows);
        }}
      });
    }
  ).then(function(hayrows){
    console.log(hayrows.length,hayrows[0].url);
    res.render('props_form',{hayrows});
  }
).catch(function(novis){
  console.log(" novis "+novis);
  res.render('props_form',{hayrows});
});

});


app.get(`/props`,function(req,res){
  if(req.query.query_url){
      url = req.query.query_url;
      request(url, function(error, response, html){
        if(!error){
          var agent = (req.cookies.agente == "true")
          var consul=[];
          var nueva_propiedad=false;
          var purl=new Promise(function(resolve,reject){connection.query("select * from consultas where url='"+url+"'",
          function(err, rows, fields){
            if(err){
              console.log(err);
            }else{
              if(rows.length!=0){
                  resolve(url);}
                else{
                  console.log("url no esta "+rows.length);
                  reject(url);}
                }
            });
          });
          purl.then(function (url){
            cheer(res,agent,html);
            console.log("despues de cheer");
            console.log(titulo,precio,descripcion,datos_arr,imagenes_arr,agent);
            if(!agent){
              database.aumentar_visitas(connection,url);}
          })
            .catch(function(url){
              console.log(url + "no esta en la base"+"\n");
              console.log("antes nueva_propiedad es "+nueva_propiedad+"\n");
              nueva_propiedad=true;
              console.log("despues nueva_propiedad es "+nueva_propiedad);
              database.agregar_url(connection,url);
              console.log("despues de agregar_url");
              cheer(res,agent,html);
              console.log(titulo,precio,descripcion,datos_arr,imagenes_arr,agent);
              database.agregar_propiedad(connection,url,precio,descripcion,titulo,datos_arr,imagenes_arr);
            });

        }
      });
    };
  });

          //console.log("ANTES DE PROMISE "+url);



              // database.read(function(visitas){
              //   var found = false;
              //   for (var i = 0; i < visitas.length && !found; i++) {
              //   //console.log(visitas[i].texto +" "+ url+" "+(visitas[i].texto === url))
              //     if (visitas[i].texto === url) {
              //       visitas[i].numero++
              //       found = true;
              //     }
              //   }
              //   if(!found)  {
              //     database.write(url+","+"0"+"\n");
              //     // var q="insert into consultas(id,url,agente_id,cliente_id,visitas) values(default," + url +",4,1,default"
              //     // connection.query(q, function(err, rows, fields) {
              //     //   if (!err)
              //     //     console.log('Se agrego  ', rows, 'fila(s)');
              //     //   else
              //     //     console.log('Error insertando url.');
              //     // });
              //   }else{
              //     if(!agent){
              //       fs.unlinkSync('./historial.txt');
              //       for (var i = 0, len = visitas.length; i < len; i++) {
              //         database.write(visitas[i].texto+","+visitas[i].numero+"\n");
              //       };
              //     }
              //   }
              // });



      app.listen(`8081`);
      console.log(`Server is up and running`);
      exports=module.exports=app;
