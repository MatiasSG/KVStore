# KVStore

## Instalación
Para descargar dependencias
```
npm install
```
## Ejecución
Levantar uno o más nodos de datos, indicando el puerto en el que cada uno va a escuchar:
```
node Nodo.js 3100
node Nodo.js 3200
node Nodo.js 3300
```
Levantar un orquestador, indicando el puerto en el que va a escuchar y la lista de nodos con los que va a trabajar:
```
node Orquestador.js 3000 localhost:3100 localhost:3200 localhost:3300
```
## Configuración
Los nodos de datos pueden recibir un archivo de configuración como tercer parametro
```
node Nodo.js 3100 unaconf.json
```
Debe tener el formato siguiente
```
{
  "maxKeySize": 512, // maximo tamaño de clave en megabytes
  "maxValSize": 512, // maximo tamaño de valor en megabytes
  "maxPairNum": 1024 // maxima cantidad de pares clave-valor por nodo
}
```
## Uso
Enviar un JSON por POST al orquestador para almacenar claves:
```
curl -d '{ "key" : "nombre", "value" : "Fede" }' -H "Content-Type: application/json" -X POST http://localhost:3000
```
Para leer claves, hacer GET al orquestador con el nombre de la clave en la URL:
```
curl http://localhost:3000/nombre
```
## Debugging
Setear variable DEBUG para activar log:
```
export DEBUG=KVStore*
```
