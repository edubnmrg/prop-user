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
VALID_USER = "AGENTE";
VALID_PASSWORD = "ORION";
var ahora=new Date();
console.log(ahora.getTime());
console.log(ahora.toTimeString());
var titulo, descripcion,precio;
var datos_arr=[];
var imagenes_arr=[];
function cheer(res,agent,html){
  var $ = cheerio.load(html);
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
            //console.log("despues de cheer");
            //console.log(titulo,precio,descripcion,datos_arr,imagenes_arr,agent);
            if(!agent){
              database.aumentar_visitas(connection,url);}
          })
            .catch(function(url){
              //console.log(url + "no esta en la base"+"\n");
              //console.log("antes nueva_propiedad es "+nueva_propiedad+"\n");
              nueva_propiedad=true;
              //console.log("despues nueva_propiedad es "+nueva_propiedad);
              database.agregar_url(connection,url);
              //console.log("despues de agregar_url");
              cheer(res,agent,html);
              //console.log(titulo,precio,descripcion,datos_arr,imagenes_arr,agent);
              database.agregar_propiedad(connection,url,precio,descripcion,titulo,datos_arr,imagenes_arr);
            });
            res.render('props',{precio,descripcion,titulo,datos_arr,imagenes_arr});
        }
      });
    };
  });

  app.get(`/propsid`,function(req,res){
    // console.log(req.query.id);
    // console.log("propsid");
    ahora.getTime();
    var titulo,descripcion,precio;
    var datos_arr=[];
    var imagenes_arr=[];
    console.log(ahora.toTimeString());
    if(req.query.id){
      var agent = (req.cookies.agente == "true");
      if(!agent){
        database.aumentar_visitas(connection,url);
      }
      new Promise(function(resolve,reject){
        console.log("select * from propiedades where propiedades.id="+req.query.id+";");
        connection.query("select * from propiedades where propiedades.id="+req.query.id+";",function(err,rows,fields){
          if(err){
            reject(err);
          }else{
            console.log("lineas "+rows.length);
            console.log(rows[0].titulo);
            titulo=rows[0].titulo;
            descripcion=rows[0].descripcion;
            precio=rows[0].precio;

            resolve(rows);
          }
        })

        }).then(function(rows){
          new Promise(function(resolve,reject){
          console.log("select * from datos_propiedades where prop_id="+req.query.id+";");
          connection.query("select * from datos_propiedades where prop_id="+req.query.id+";",function(err,rows,fields){
            if(err){
              reject(err);
            }else{
              console.log("datos "+rows.length);
              console.log(rows[0].dato);
              rows.forEach(function(elem){
                datos_arr.push(elem.dato)
              })
              resolve(rows);
            }
          })
        }).then(function(rows){

          new Promise(function(resolve,request){
            console.log("select * from imagenes_propiedades where prop_id="+req.query.id+";");
            connection.query("select * from imagenes_propiedades where prop_id="+req.query.id+";",function(err,rows,fields){
              if(err){
                reject(err);
              }else{
                console.log("imagenes "+rows.length);
                console.log(rows[0].imagen);
                rows.forEach(function(elem){
                  imagenes_arr.push(elem.imagen)
                })
                resolve(rows);
              }
            })
          }).then(function(rows){
            console.log("entro en then");
            res.render('props',{precio,descripcion,titulo,datos_arr,imagenes_arr})
          },function(err){
            console.log("error")
            res.render('err',{err})
          })

        },function(err){
          console.log("error")
          res.render('err',{err})
        });
          //res.render('props',{precio,descripcion,titulo,datos_arr,imagenes_arr})
        }//end then
        ,function(err){
          console.log("error")
          res.render('err',{err})
      })//end promise prop
    };
  });


      app.listen(`8081`);
      console.log(`Server is up and running`);
      exports=module.exports=app;
