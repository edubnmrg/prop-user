var fs =require(`fs`);
///leer linea
///escribir un item
///modificar registro

function Database(){}
function SoloNumeros(s){
  var result=""
  for(var i=0;i<s.length;i++){
    if("0123456789.".indexOf(s[i])>=0){
      result+=s[i];
    }
  }
  return result;
}
Database.prototype.read = function(callback){
  var visitas = [];
  var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream('./historial.txt')
  });

  lineReader.on('line', function (line) {
    var partes=[];
    partes=line.split(",");
    //console.log(partes[0]+partes[1]);
    visitas.push({texto: partes[0],numero: partes[1]});
  });
  lineReader.on('close',function(){
    callback(visitas)
  });
  return true;
}
Database.prototype.write = function(item){
  var fs = require('fs');
  //console.log("modulo "+item);
  fs.appendFile("./historial.txt", (item), function (err) {


    //console.log("The item was saved!");
  });
}

//[string, numero]
//registro[1] = registro[1] + 1;

Database.prototype.flush = function(){

}
// var db = new Database();
//
// db.read(function(res){ console.log(res)})
// db.write({ prop: "cabildo", numero: "5"})
//db.read(function(res){ console.log(res)})
Database.prototype.aumentar_visitas=function(connection,url){
  console.log("aumentar visitas"+url);
  console.log("update consultas set visitas=visitas+1 where url='"+url+"'");
  pa=new Promise(function(resolve,reject){connection.query("update consultas set visitas=visitas+1 where url='"+url+"';",function(err, rows, fields){
    if(err){
      console.log("error de datos "+err);
    }else{
      console.log("rowslength "+rows.length);
      if(rows.length==0){

        console.log("rows "+rows.length+" no se encuentra url para aumentar visitas");
        reject();}
        else{
          //console.log("resolve");
          resolve();
        }}
     });
   });
   pa.then(function(){
     console.log("se aumento el numero de visitas");
   })
   .catch(function(){
     console.log("no se encontro url");
   })
};

Database.prototype.agregar_url=function(connection,url){
  console.log("agregar_url"+"\n"+connection+"\n"+url);
  pa=new Promise(function(resolve,reject){connection.query("insert into consultas (url,agente_id,cliente_id,visitas) values('"+url+"',1,1,1);",function(err, rows, fields){
    if(err){
      console.log(err);
    }else{
      //console.log("rowslength "+rows.length);
      if(rows.length==0){
        console.log("insert into consultas (url,agente_id,cliente_id,visitas) values('"+url+"',1,1,1)");
        reject();}
        else{
          //console.log("resolve");
          resolve();
        }}
     });
   })
   pa.then(function(){
     console.log("propiedad agregada");
   })
   .catch(function(){
     console.log("no se pudo agregar url");
   })
}
Database.prototype.agregar_propiedad=function(connection,url,precio, descripcion, titulo, datos,imagenes){
  var prop=new Promise(function(resolve,reject){
    precio=SoloNumeros(precio);
    // console.log("precio "+precio);
    // console.log("insert into propiedades (url,precio,descripcion,titulo) values('"+url+"',"+precio+",'"+descripcion+"','"+titulo+"')");
    connection.query("insert into propiedades (url,precio,descripcion,titulo) values('"+url+"',"+precio+",'"+descripcion+"','"+titulo+"')",
    function(err, rows, fields){
      if(err){
        reject(err);
      }else{
        resolve(rows);
      }
    })
  });
  prop.then(function(rows){
    var propId=rows.insertId;
    console.log(rows.insertId);
    var dat=new Promise(function(resolve,reject){
      datos.forEach(function(elem){
        console.log("insert into datos_propiedades (prop_id,dato) values("+propId+",'"+elem.texto.trim()+"')");
        connection.query("insert into datos_propiedades (prop_id,dato) values("+propId+",'"+elem.texto.trim()+"')",
        function(err,rows,fields){
          if(err){
            reject(err);
          }
        })
      });
      resolve();
    });
    dat.then(function(rows){
      var img=new Promise(function(resolve,reject){
        imagenes.forEach(function(elem){
          console.log("insert into imagenes_propiedades (prop_id,imagen) values("+propId+",'"+elem.imagen+"')");
          connection.query("insert into imagenes_propiedades (prop_id,imagen) values("+propId+",'"+elem.imagen+"')",
          function(err,rows,fields){
            if(err){
              reject(err);
            }
          });
        });
        resolve(imagenes.length);
      });
      img.then(function(dimension){
        console,log("imagenes guardadas"+dimension);
      })
      .catch(function(err){
        console,log("imagenes "+err);
      })

    })
    .catch(function(err){
      console.log("datos "+err);
    })
  })
  .catch(function(err){
    console.log("propiedades "+err);
  });
}
Database.prototype.cargar_propiedad=function(connection,id,precio, descripcion, titulo, datos,imagenes){
  var prop=new Promise(function(resolve,reject){
    //precio=SoloNumeros(precio);
    //console.log("precio "+precio);
    //console.log("insert into propiedades (url,precio,descripcion,titulo) values('"+url+"',"+precio+",'"+descripcion+"','"+titulo+"')");
    connection.query("select * from propiedades where id="+id+"",
    function(err, rows, fields){
      if(err){
        reject(err);
      }else{

        precio=rows[0].precio;
        descripcion=rows[0].descripcion;
        titulo=rows[0].titulo
        console.log(precio,descripcion,titulo);
        resolve(rows);
      }
    })
  });
  prop.then(function(rows){

    var dat=new Promise(function(resolve,reject){

        console.log("select * from datos_propiedades where prop_id="+id);
        connection.query("select * from datos_propiedades where prop_id="+id,
        function(err,rows,fields){
          if(err){
            reject(err);
          }else{
            rows.forEach(function(elem){
              //console.log(elem.dato);
              datos.push(elem.dato);
            });
            resolve(rows);
          }
        })


    });
    dat.then(function(rows){
      var img=new Promise(function(resolve,reject){
          console.log("select * from imagenes_propiedades where prop_id="+id);
          connection.query("select * from imagenes_propiedades where prop_id="+id,
          function(err,rows,fields){
            if(err){
              reject(err);
            }else{
              rows.forEach(function(elem){
                //console.log(elem.imagen);
                imagenes.push(elem.imagen);
              });
              resolve(rows);
            }
          });
      });
      img.then(function(rows){
        console,log("imagenes guardadas"+rows.length);
      })
      .catch(function(err){
        console,log("imagenes "+err);
      })

    })
    .catch(function(err){
      console.log("datos "+err);
    })
  })
  .catch(function(err){
    console.log("propiedades "+err);
  });
}
module.exports.instance = new Database();
