#! /bin/bash

#export DEBUG=KVStore*

node Nodo.js 3100 &
node Orquestador.js -beMaster 3000 localhost:3100 &
node Orquestador.js 3001 localhost:3100 &

sleep 5

curl localhost:3000/is-master -w " REQUEST A 3000\n"

curl localhost:3001/is-master -w " REQUEST A 3001\n"

curl -d '{ "key" : "unaClave", "value" : "unValor" }' -H "Content-Type: application/json" -X POST http://localhost:3000 -w "\n"

curl localhost:3000/unaClave -w " LA CLAVE DEBERIA EXISTIR\n"
curl -X DELETE localhost:3000/unaClave -w "BORRANDO CLAVE...\n"
curl localhost:3000/unaClave -w " LA CLAVE YA NO DEBERIA EXISTIR\n"
curl localhost:3000/unaClave -w " TAMPOCO DEBERIA EXISTIR EN EL OTRO ORQUESTADOR\n"

echo
killall node