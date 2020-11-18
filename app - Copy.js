const { COPYFILE_FICLONE_FORCE } = require('constants');
var express = require('express');
var fs = require('fs');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log("server initialized");
//from classes file
class Entity                                                                           //anything in the game that collides
{                                                                                      //expect for the player character
                                                                                       //TODO draw function to client
  constructor(xPos, yPos, zPos, xVel, yVel, zVel, scale, density)             //extends GameObject with scale and density
  {                                                                                    //for calculating physics interactions on collision   
    this.xPos = xPos;
    this.yPos = yPos;
    this.zPos = zPos;
    this.xVel = xVel;
    this.yVel = yVel;
    this.zVel = zVel;
    this.scale = scale;
    this.density = density;
    this.isColliding = false;
  }

  draw()                                                                              //determines where the object resides and draws it
  {                                                                                   //and draws it on the appropriate canvas context
    if(this.context==contextBag[numCanvases-1])                                       //in the appropriate color 
    {
      this.context.fillStyle = '#440033';
    }
    else
    {
      for(var i = 0; i < numCanvases; i++)
      {
        if(this.context==contextBag[numCanvases-1-i])                                 //color determined by canvas, simulating depth 
        {                                                                             //in the Z-axis. lighter colors are further away 
          var num = (256/numCanvases)*i;                                              //non-player objects are purple when they are on
          var color = '#' + num.toString(16) + '0000';                                //the same canvas as the player(s) and can collide
          this.context.fillStyle = color;                                             //with them 
        }
      }
    }
    this.context.beginPath();                                                         //draw circle representing blood vessel in blood stream                         
    this.context.arc(this.xPos, this.yPos, this.scale, 0, 2*Math.PI);
    this.context.fill();
  }

  update(seconds)                                                                    //updates velocity and position of object 
  {
    if(this.xVel != 0){this.xVel*=0.999;}                                            //friction, slowing velocity in all directions over time
    if(this.yVel != 0){this.yVel*=0.999;}
    if(this.zVel != 0){this.zVel*=0.999;}	
    this.yVel += 0.1;                                                                //simulates blood flow, moving objects toward bottom screen
    this.xPos += this.xVel*seconds;                                                  //position updated by velocity during that frame
    this.yPos += this.yVel*seconds;                                                  //in each spatial direction
    this.zPos += this.zVel*seconds;
  }
}

class Projectile                                                                     //emitted object which does not collide with players
{                                                                                    //and only operates within one canvas. no Z-movement.
                                                                                     //TODO need to move draw function to client
  constructor(xPos, yPos, xVel, yVel, scale, density)
  {
    this.xPos=xPos;
    this.yPos=yPos;
    this.xVel=xVel;
    this.yVel=yVel;
    this.scale=scale;
    this.density=density;
  }

  draw()
  {
    this.context.fillStyle = '#000000';                  
    this.context.beginPath();
    this.context.arc(this.xPos, this.yPos, this.scale, 0, 2*Math.PI);     
    this.context.fill();
  }

  update(seconds)
  {
    this.xPos += this.xVel*seconds;        
    this.yPos += this.yVel*seconds;
  }
}

class Player                                                                      //player character object. duplicated in TUT
{                                                                                 //TODO Player object ON SERVER
                                                                                  //TODO draw function needs to move to client
  constructor(xPos, yPos, xVel, yVel, scale, density, health)            //May need to double up basic class information on
  {                                                                               //So info is easier to handle since the draw function
                                                         //Requires it. Same with anything updating that draws 
    this.xPos=xPos;
    this.yPos=yPos;
    this.xVel=xVel;
    this.yVel=yVel;
    this.xVec=0;                                                                 //x and y component of the object's
    this.yVec=1;                                                                 //normalized forward vector 
    this.FirePointX=0;                                                           //point on the screen where the player
    this.FirePointY=scale;                                                       //character's Projectiles/Weapons originate
    this.scale=scale;
    this.density=density;
    this.health=health;                                                          //health of the player object. displayed as hull.
    this.isColliding=false;
    this.angle=0;                                                                //angle of the player's forward vector in relation to true north
    this.MAX_MAG=25;                                                             //maximum velocity of player object                                                            //for future expansion. will hold player object's weapons objects
  }
 
  draw()                                                                        //TO DO upgrade player appearance
  {
    this.context.save();
    this.context.translate(this.xPos, this.yPos);                               //move player canvas to new position
    this.context.fillStyle = '#FFAA00';                                         //draw player thruster graphic 
    this.context.beginPath();                                                   //TODO only draw when player is imparting thrust
    this.context.arc(this.FirePointX/-2, this.FirePointY/-2, 14, 0, 2*Math.PI);
    this.context.fill();
    this.context.fillStyle = '#0000FF';                                         //draw player fire point graphic
    this.context.beginPath();
    this.context.arc(this.FirePointX, this.FirePointY, 4, 0, 2*Math.PI);
    this.context.fill();
    this.context.rotate(this.angle);                                            //rotate canvas to the player's rotation 
    this.context.fillStyle = '#00FF00';                                         //draw main body of player object
    this.context.beginPath();                                                   //canvas is translated and rotated. player object
    this.context.arc(0, 0, this.scale, 0, 2*Math.PI);                           //is rendered normally to make the player object
    this.context.fill();                                                        //appear to translate and rotate relative to
    if(this.isColliding)                                                        //player view
    {
      this.context.fillStyle = '#FF0000';                                       //recolors player object on collision to indicate
      this.context.beginPath();                                                 //to the player that a collision has occurred
      this.context.arc(0, 0, this.scale, 0, 2*Math.PI);     
      this.context.fill();
      this.health--;
    }
    this.context.restore();          
  }

  changeVel(xValue, yValue)                                                      //TODO figure out what I was doing here
  {
    console.log("x: " + xValue + " y: " + yValue);
    console.log("bxvel: " + this.xVel + " byvel: " + this.yVel);
    this.xVel += xValue;
    this.yVel += yValue;
    console.log("axvel: " + this.xVel + " ayvel: " + this.yVel);
  }
  changeAngle(amount)
  {
    this.angle += amount;
  }
  changeHealth(amount)
  {
    this.health += amount;
  }

  update(seconds)
  {
    this.xVec = Math.sin(this.angle);                                           //calculate forward vector based on
    this.yVec = Math.cos(this.angle);                                           //player character object's rotation
    this.FirePointX=this.xVec*this.scale;                                       //calculate position of fire point
    this.FirePointY=this.yVec*this.scale*(-1);                                  //based on forward vector    
    if(this.xVel != 0){this.xVel*=0.99;}                                        //friction
    if(this.yVel != 0){this.yVel*=0.99;}
    this.yVel += 0.003;                                                         //effect of blood flow on players
    var speedRatio = ((this.xVel*this.xVel)+(this.yVel*this.yVel))/this.MAX_MAG;
    if(speedRatio>1)                                                            //cap forward speed to MAX_MAG
    {
      this.xVel/=speedRatio;
      this.yVel/=speedRatio;
    }
    this.xPos+=this.xVel;                                                       //position updated by velocity
    this.yPos+=this.yVel;
    if(this.xPos<this.scale)                                                    //keeps player object in the play area
    {
      this.xPos=this.scale;
      this.xVel*=-0.5;
    }
    if(this.xPos>1024-this.scale)
    {
      this.xPos=1024-this.scale;
      this.xVel*=-0.5;
    }
    if(this.yPos<this.scale)
    {
      this.yPos=this.scale;
      this.yVel*=-0.5;
    }
    if(this.yPos>768-this.scale)
    {
      this.yPos=768-this.scale;
      this.yVel*=-0.5;
    }
  }
}
//from gameLoop file
var numCanvases = 16;                                          //defines amount of layers among play area objects
var spawnClock = 0;                                            //temp variables to keep objects from spawning
var spawnRate = 10;                                            //every frame, also increase difficulty
var player;                                                    //player character object
var playerObjects = [];                                        //array that holds player and all player-fired objects
var PLAYER_LIST = [];                                          //duplicated in TUT
var patientHealth = 1000;                                      //health score metric for display
var randomizer;                                                //variable for randomizing various processes
var layerObjects = [];
var bRunLoop = false;
var bResetMultiplier = false;                             //TODO move to player object?
var intervalTime = 20;
var tick = 0;
var pressedKeys = {"a":false,"d":false,"s":false, "w":false, "m":false};
var viewPackage = {                                                //in game loop                                                //tracks frames elapsed
  secs : 0,                                                 //tracks seconds elapsed
  mins : 0,                                                 //tracks minutes elapsed
  playerScore : 0,                                          //player's actual score                                      //displayed score for score incrementation animation
  multiplier : 1,
};


function fire()                                           //dynamically create missile at player's fire point in the direction of player's forward vector
{                                                         //refactor this out of game loop and into player object for multiplayer                        
  var spawn = new Projectile(player.xPos+player.FirePointX, player.yPos+player.FirePointY, player.FirePointX*25, player.FirePointY*25, 10, 2);
  playerObjects.push(spawn);                              //place in array with player objects so they dont collide with each other 
}

function sendData()
{
  socket.emit('playerLayer', playerObjects);
  socket.emit('objectLayers', layerObjects);
  socket.emit('viewLayer', viewPackage);
}
/*
function gameLoop(currentTime)                            //everything that occurs in the game during a given frame. duplicated in TUT
{
  randomizer = Math.random() - 0.5;                       //creates a random number between -0.5 and 0.5 to randomize various processes
                                                          //TODO refactor into function. maybe move into cleanup loop    
  cleanUpLoop();                                          //removes non-player objects from their arrays for gabage collection when off screen 

  spawnClock++                                            //temporary spawner delay that decreases the long the game is played to increase difficulty
  if(spawnClock==spawnRate)                               
  {
    spawnerLoop();                                        //loop that creates various game objects that are not the player
    spawnClock = 0;                                       //nor a player missile
  }
  controller.handleInput();                               //INPUT ON CLIENT. HANDLE INPUT EMITTED INPUT HERE
  updateLoop(getTime(currentTime));                       //update of all game objects
                                                          //TODO refactor collision process        
  collisionLoop();                                        //collision calculations among all collidable game objects that arent player or player weapons

  moveInZLoop();                                          //moves objects between canvas layers based on their z value
                                                          //TRANSMIT DATA TO CLIENT HERE 
  playArea.clearCanvases();                               //CLIENT

  drawLoop();                                             //CLIENT

  view.updateUI();                                        //CLIENT
                                                          //game loop function recursion
}
*/                              

function makeLayers(amount)                              //fills the canvasObjects array with empty arrays that will be
{                                                          //used to hold dynamically created game objects
  for(var i=0; i < amount; i++)
  {
    var temp = [];
    layerObjects.push(temp);
  }
}
function spawnToCollide(spawnXPos,spawnYPos,sizeToSpawn,objects)  //checks to see if new object will collide with existing objects in a given canvas layer
{
  var obj1;
  var obj2;                                               //this variable is not used in this function
  var willCollide = false;
        
  for(i=0; i < objects.length;i++)
  {
    obj1 = objects[i];
    if(Math.abs(spawnXPos-obj1.xPos)<=(sizeToSpawn + obj1.scale)) //rough distance check based on X position
    {
      var diffX = spawnXPos-obj1.xPos;
      var diffY = spawnYPos-obj1.yPos;
      var sqDistance= Math.pow(diffX,2) + Math.pow(diffY,2);      //if near in X, check actual distance between objects, and compare to combined radius

      if(sqDistance <= Math.pow(obj1.scale + sizeToSpawn,2)){willCollide = true;}
    }
  }

  return willCollide;
} 

function spawner(objects)                                 //dynamically spawns objects using various random parameters within set ranges.
{                                                         //input parameter is an array of objects in a given layer, to which the spawned
  var randomX = Math.floor(Math.random() * 1024);         //object is added
  var randomY = Math.floor((Math.random() * 768)-10);
  var ranSize = Math.floor(Math.random() * 90) + 10;

  if(!spawnToCollide(randomX, randomY, ranSize, objects))
  {
    var randomZ;
    var ranXVel = Math.floor(Math.random() * 300)-150;
    var ranYVel = Math.floor(Math.random() * 200)-110;
    var ranZVel = Math.random() * 5;
    var ranDensity = Math.floor(Math.random() * 50) + 1;
    var currentContext;

    if(objects==layerObjects[numCanvases - 1])             //assigns a Z position based on the context of the objects in the input parameter array
    {
      randomZ = Math.floor(Math.random() * 5 + 100);
    }
    else
    {
      for(var i=0; i < layerObjects.length-1;i++)
      {
        if(objects==layerObjects[i])
        { 
          randomZ = Math.floor(Math.random() * (80/numCanvases)) + ((i+1)*(80/numCanvases));
        }
      }
    }
    var spawn = new Entity(randomX, randomY, randomZ, ranXVel, ranYVel, ranZVel, ranSize, ranDensity);
    objects.push(spawn);                                  //create new gameplay object and place into in the array for that canvas based on z-position
  }
}

function spawnerLoop()                                 //randomly chooses an array of objects from the "bottom" 6 game layers
{                                                      //and passes it into the spawner function
  var ranCanvas = Math.floor(Math.random() * 5);       //TODO rename function. This is not a loop.
  spawner(layerObjects[ranCanvas]);
}

function cleanUpOffScreen(objects)                     //checks if objects have strayed too far off screen and removes them
{                                                      //from the appropriate object array, eliminating update of the given
  for(i=0; i < objects.length; i++)                    //object and allowing it to be garbage collected
  {
    var obj = objects[i];                              //objects completely off screen left, right and bottom.
    if((obj.xPos-obj.scale)>1024||       //top allows some leeway for objects to leave play area
       (obj.xPos+obj.scale)<0||                        //and then return
       (obj.yPos-obj.scale)>768||
       (obj.yPos+obj.scale*10)<0)
    {
      if((obj.yPos-obj.scale)>768 && objects==layerObjects[numCanvases-1])
      {
        patientHealth -= obj.scale;                    //effects patient health score and resets multiplier
        bResetMultiplier = true;                        //if object removed from past bottom of screen. (i.e. pathogen
      }
      else { bResetMultiplier = false; }                                                //will effect patient) need to adjust this for multiplayer
      objects.splice(i,1);                             //possibly continue use for combined multiplier
    }                                                  //and give each player their own multiplier in addition
  }
}

function cleanUpWeapons()                              //removes player generated projectiles when too far off screen                       
{                                                      //so they no longer update and can be garbage collected
  for(i=1; i < playerObjects.length; i++)              //Allows leeway so projectiles can strike partially off screen
  {                                                    //objects. rename to cleanUpProjectiles    
    var obj = playerObjects[i];
    if((obj.xPos-100)>1024||
       (obj.xPos+100)<0||
       (obj.yPos-100)>768||
       (obj.yPos+100)<0)
    {
      playerObjects.splice(i,1);
      bResetMultiplier = true;
    }
    else { bResetMultiplier = false; }
  }
}

function cleanUpLoop()                                 //sends each canvas layer object array into the clean up function
{
  cleanUpWeapons();

  for(var i=0;i<layerObjects.length;i++)
  { 
    cleanUpOffScreen(layerObjects[i]);
  } 
}

function handleInput()                                           //KEEP ON SERVER SIDE IN CONTROLLER HANDLER, LOOP THROUGH EACH PLAYER
{
  if(!pressedKeys || pressedKeys == null)
  { 
    pressedKeys = {"a":false,"d":false,"s":false, "w":false, "m":false}; 
  }
  if(pressedKeys["a"]&&pressedKeys["d"]&&pressedKeys["w"])         //forward no rotation when a,d,w pressed
  {
    player.changeVel(0.01*player.FirePointX,0.01*player.FirePointY);    
  }
  else if(pressedKeys["a"]&&pressedKeys["w"])                      //forward and rotate left when a,w pressed
  {
    player.changeAngle(-0.05);
    player.changeVel(0.01*player.FirePointX,0.01*player.FirePointY); 
  }                                 
  else if(pressedKeys["d"]&&pressedKeys["w"])                      //forward and rotate right when d,w, pressed
  {
    player.changeAngle(0.05);
    player.changeVel(0.01*player.FirePointX,0.01*player.FirePointY);
  }
  else if(pressedKeys["a"]&&pressedKeys["s"])                     //backward and rotate left when a,s, pressed
  {
    player.changeAngle(-0.02);
    player.changeVel(-0.001*player.FirePointX,-0.001*player.FirePointY);
  }                                                       
  else if(pressedKeys["d"]&&pressedKeys["s"])                     //backward and rotate right when d,s, pressed
  {
    player.changeAngle(0.02);
    player.changeVel(0.001*player.FirePointX,0.001*player.FirePointY); 
  }                                                       
  else if(pressedKeys["a"])                                       //rotate left when a only pressed
  {
    player.changeAngle(-0.1);
  }
  else if(pressedKeys["d"])                                       //rotate right when d only pressed
  {
    player.changeAngle(0.1);
  }
  else if(pressedKeys["s"])                                       //backward when s only pressed
  {
    player.changeVel(-0.001*player.FirePointX,-0.001*player.FirePointY)               
  }
  else if(pressedKeys["w"])                                       //forward when w only pressed
  {
    player.changeVel(0.01*player.FirePointX,0.01*player.FirePointY);
    console.log("W PRESSED MOVE UP")               
  }
  if(pressedKeys["m"]){ fire(); }
  console.log(pressedKeys);
}
function updateLoop(delta)                             //input parameter is amount of time which has passed during a given frame
{                                                      //which is then passed into the update function of each object in the game
  for(var i=0; i < playerObjects.length; i++)          
  {
    playerObjects[i].update(delta);                    //updates player and all player generated projectiles
  }  

  for(var i=0; i < layerObjects.length; i++)          //updates each object in a given canvas layer one at a time, one canvas at
  {                                                    //time until all non-player objects are updated
    var group = layerObjects[i];
    for(var j=0; j < group.length; j++)
    {
      group[j].update(delta);
    }  
  }
}

function moveInZ(objects)                                  //moves objects between the various canvas layer object arrays based on their Z position value
{                                                          //provides the illusion of movement in the 3rd spatial direction.
  for(var i = 0; i < objects.length; i++)                  //input parameter is an array of objects rendering in a given canvas layer
  {                                                        //TODO bool or early check so n-squared algorithm isnt necessary for objects that wont be moving
    for(var j = 0; j < layerObjects.length; j++)
    {
      if(objects[i].zPos < (j+1)*(80/numCanvases) && (j+1)*(80/numCanvases) < 80)  //the z position zone of the numCanvases-1 bottom layers
      {
        layerObjects[j].push(objects[i]);                 //adds object to the object array for that layer
        objects.splice(i,1);                               //removes object from previous layer
        j = layerObjects.length;                          //exits loop
      }
      else if(objects[i].zPos >= (80 - (80/numCanvases)))  //special case for state for top layer where player objects reside
      {
        if(objects[i].yPos < 600)                          //keeps objects from pushing into the top layer at the bottom of the screen
        {
          layerObjects[numCanvases-1].push(objects[i]);
          objects.splice(i,1);
          j = layerObjects.length;
        }
      }
    }
  }              
}

function moveInZLoop()                                     //sends all of the canvas layer object arrays into the moveInZ function to be checked
{
  for(var i=0; i < layerObjects.length;i++)
  {
    moveInZ(layerObjects[i]);
  }
}

function detectCollision(objects)                          //detects collision between all collidable objects in a given canvas layer object array
{                                                          //input parameter is a canvas layer object array
                                                                                                         
  for(i=0; i < objects.length;i++)                         //resets each object's variable that indicates if the object is colliding with something else during a given frame
  {
    objects[i].isColliding = false;
  }

  for(i=0; i < objects.length;i++)                         //compares each object with every other object in the canvas layer object array
  {

    for(j=i+1; j < objects.length;j++)
    {
      if((Math.abs(objects[i].xPos-objects[j].xPos)) <= (objects[i].scale + objects[j].scale))
      {                                                    //quick check to see if objects are near each other in X before doing more computationally heavy
        collisionReaction(objects,i,j);                    //checks for collision
      }                                                    //TODO double this up to check for Y
    }
  }
}

function playerCollision(objects)                          //detects collision between player and player projectiles with top layer objects
{
  var obj1;
  var obj2;
                                            
  for(i=0; i < playerObjects.length;i++)                   //resets each player object's variable that indicates if the object is colliding with something
  {                                                        //else during a given frame
    playerObjects[i].isColliding = false;
  }
                                                   
  for(i=0; i < objects.length;i++)                         //same for all non-player objects
  {
    objects[i].isColliding = false;
  }

  for(i=0; i < playerObjects.length; i++)
  {
    obj1 = playerObjects[i];
    for(j=0; j < objects.length;j++)                               //compares each object with player and/or player projectiles
    {
      obj2 = objects[j];
      if((Math.abs(obj1.xPos-obj2.xPos)) <= (obj1.scale + obj2.scale))  //filters checks for collision based on X position
      {                                                                 //TODO add Y position check as well.
        var deltaX = obj2.xPos-obj1.xPos;
        var deltaY = obj2.yPos-obj1.yPos;
        var sqDistance= Math.pow(deltaX,2) + Math.pow(deltaY,2);
        if(sqDistance <= (Math.pow(obj1.scale + obj2.scale,2)))    //checks to see if the distance between two objects is less than equal to their combined radii
        {                                                          //thereby indicating a collision.
          obj1.isColliding=true;                                   //makes various physics calculations based on the parameters on the two objects in the collision
          obj2.isColliding=true;                                   //TO DO move into a function  
          var vNorm = {x: deltaX/Math.sqrt(sqDistance), y: deltaY/Math.sqrt(sqDistance)};
          var vRelVel = {x: obj1.xVel-obj2.xVel, y: obj1.yVel-obj2.yVel};
          var speed = (vRelVel.x * vNorm.x) + (vRelVel.y * vNorm.y);
          if (speed < 0){speed = 0;}
          var impulse = 2* speed / ((obj1.scale*obj1.density) + (obj2.scale*obj2.density));
          obj1.xVel -= (impulse*obj2.scale*obj2.density*vNorm.x);
          obj1.yVel -= (impulse*obj2.scale*obj2.density*vNorm.y);
          obj2.xVel += (impulse*obj1.scale*obj1.density*vNorm.x);
          obj2.yVel += (impulse*obj1.scale*obj1.density*vNorm.y);
          if(!endGame()){view.playerScore += Math.ceil(1000/obj2.scale) * view.multiplier;}                       //TODO NEED TO ADJUST THIS TO CURRENT "view" SETUP
          obj2.scale-=obj1.scale;
          if(sqDistance/(Math.pow(obj1.scale + obj2.scale,2)) < 0.9)
          {
            var midPoint = {x: (obj2.xPos+obj1.xPos)/2, y: (obj2.yPos+obj1.yPos)/2};
            var distOne = Math.pow((midPoint.x - obj1.xPos),2) + Math.pow((midPoint.y - obj1.yPos),2);
            var distTwo = Math.pow((midPoint.x - obj2.xPos),2) + Math.pow((midPoint.y - obj2.yPos),2);
            var vecOne = {x: (obj1.xPos - midPoint.x)/distOne, y: (obj1.yPos - midPoint.y)/distOne};
            var vecTwo = {x: (obj2.xPos - midPoint.x)/distOne, y: (obj2.yPos - midPoint.y)/distOne};
            obj1.xVel += (vecOne.x/obj1.scale)*1000;
            obj1.yVel += (vecOne.y/obj1.scale)*1000;
            obj2.xVel += (vecTwo.x/obj2.scale)*1000;
            obj2.yVel += (vecTwo.y/obj2.scale)*1000;
          }
          if(i>0)
          {
            view.multiplier++;                                                                                   //TODO NEED TO ADJUST THIS TO CURRENT "view" SETUP
            playerObjects.splice(i,1);
            if(obj2.scale > 60)
            {
              var randomizeXPos = ((Math.random() * obj2.scale * Math.sqrt(2)) - obj2.scale/Math.sqrt(2)) * randomizer;
              var randomizeYPos = ((Math.random() * obj2.scale * Math.sqrt(2)) - obj2.scale/Math.sqrt(2)) * randomizer;
              var randomizeXVel = ((Math.random() * obj2.scale * Math.sqrt(2)) - obj2.scale/Math.sqrt(2)) * randomizer;
              var randomizeYVel = ((Math.random() * obj2.scale * Math.sqrt(2)) - obj2.scale/Math.sqrt(2)) * randomizer;
              var spawn = new Entity((obj2.xPos)+randomizeXPos, (obj2.yPos)+randomizeYPos, obj2.zPos, (obj2.xVel)+randomizeXVel, (obj2.yVel)+randomizeYVel, obj2.zVel, Math.ceil((obj2.scale)/Math.sqrt(2)), obj2.density);
              obj2.scale = Math.ceil(obj2.scale/Math.sqrt(2));
              objects.push(spawn);
            }
          }
          else{view.resetMultiplier()};                                                                         //TODO NEED TO ADJUST THIS TO CURRENT "view" SETUP        
          if(obj2.scale<10){objects.splice(j,1);}
        }
      }
    }
  }
}
function collisionReaction(objs,i,j) //TODO update comments
{
      var obj1 = objs[i];
      var obj2 = objs[j];
      var deltaX = obj2.xPos-obj1.xPos;
      if(deltaX <= obj1.scale + obj2.scale)
      var deltaY = obj2.yPos-obj1.yPos;
      var sqDistance= Math.pow(deltaX,2) + Math.pow(deltaY,2);
      var overlap = sqDistance/(Math.pow(obj1.scale + obj2.scale,2));
      if(overlap <= 1)                                           //checks to see if the distance between two objects is less than equal to their combined radii
      {                                                          //thereby indicating a collision.
        obj1.isColliding=true;                                   //makes various physics calculations based on the parameters on the two objects in the collision
        obj2.isColliding=true;                                   //TO DO move into a function
        var midPoint = {x: (obj2.xPos+obj1.xPos)/2, y: (obj2.yPos+obj1.yPos)/2};
        if((obj1.scale + obj2.scale) < 70 && overlap < 0.98)     //small objects that collide and sufficiently overlap combine into a larger object
        {
          var obj1Mass = obj1.scale*obj1.scale*obj1.density;
          var obj2Mass = obj2.scale*obj2.scale*obj2.density;
          var obj1Momen = {x: obj1.xVel*obj1Mass, y: obj1.yVel*obj1Mass};
          var obj2Momen = {x: obj2.xVel*obj2Mass, y: obj2.yVel*obj2Mass};
          var obj3Vel = {x: (obj1Momen.x + obj2Momen.x)/(obj1Mass + obj2Mass), y: (obj1Momen.y + obj2Momen.y)/(obj1Mass + obj2Mass)}; 
          var spawn = new Entity(midPoint.x, midPoint.y, (obj1.zPos + obj2.zPos)/2, obj3Vel.x, obj3Vel.y, (obj1.zVel + obj2.zVel)/2, Math.ceil((obj1.scale + obj2.scale)/Math.sqrt(2)),
                                ((((Math.pow(obj1.scale,2) * obj1.density) + (Math.pow(obj2.scale,2) * obj2.density))) / (Math.pow(obj1.scale + obj2.scale,2))));
          if(i<j)
          {                                                      //uses position in array to determine correct order of removal
            objs.splice(j,1);
            objs.splice(i,1);
          }
          else
          {
            objs.splice(i,1);
            objs.splice(j,1);
          }
          objs.push(spawn);                                      //add new combined object to object array 
        }
        else
        {
          if(overlap > 0.95)                                     //large objects with not much overlap on collision will bounce off each other
          {
            collisionPhys(deltaX, deltaY, sqDistance, obj1, obj2); 
          }
          else if(overlap <=0.95)                                 //large objects with more overlap will react more violently, accelerating apart 
          {                                                       //until no longer overlapping
            var distOne = Math.pow((midPoint.x - obj1.xPos),2) + Math.pow((midPoint.y - obj1.yPos),2);
            var distTwo = Math.pow((midPoint.x - obj2.xPos),2) + Math.pow((midPoint.y - obj2.yPos),2);
            var vecOne = {x: (obj1.xPos - midPoint.x)/distOne, y: (obj1.yPos - midPoint.y)/distOne};
            var vecTwo = {x: (obj2.xPos - midPoint.x)/distOne, y: (obj2.yPos - midPoint.y)/distOne};
            obj1.xVel += (vecOne.x/obj1.scale)*1000;
            obj1.yVel += (vecOne.y/obj1.scale)*1000;
            obj2.xVel += (vecTwo.x/obj2.scale)*1000;
            obj2.yVel += (vecTwo.y/obj2.scale)*1000;
          }        
        }
      }
}

function collisionPhys(dX,dY,sqDist,o1,o2)                       //takes the forward momentum of the two objects and determines what their direction
{                                                                //and velocity should be after collision.
          var vNorm = {x: dX/Math.sqrt(sqDist), y: dY/Math.sqrt(sqDist)};
          var vRelVel = {x: o1.xVel-o2.xVel, y: o1.yVel-o2.yVel};
          var speed = (vRelVel.x * vNorm.x) + (vRelVel.y * vNorm.y);
          if(speed < 0){speed = 0;}
          var impulse = 2* speed / ((o1.scale*o1.density) + (o2.scale*o2.density));
          o1.xVel -= (impulse*o2.scale*o2.density*vNorm.x);
          o1.yVel -= (impulse*o2.scale*o2.density*vNorm.y);
          o2.xVel += (impulse*o1.scale*o1.density*vNorm.x);
          o2.yVel += (impulse*o1.scale*o1.density*vNorm.y);
}
function collisionLoop()                                         //sends each canvas layer object array into the collision detection function
{
  playerCollision(layerObjects[numCanvases-1]);

  for(var i=0; i < layerObjects.length;i++)
  {
    detectCollision(layerObjects[i]);
  }
}
/*
function drawLoop()                                             //loops through the draw function of every game object
{
  for(var i=0; i < playerObjects.length; i++)                   
  {
    playerObjects[i].draw();
  } 

  for(var i=0; i < canvasObjects.length; i++)
  {
    var group = canvasObjects[i];
    for(var j=0; j < group.length; j++)
    {
      group[j].draw();
    }  
  }
}
*/
function endGame()                                              //checks conditions for game being over
{                                                               //TODO adjust for multiplayer
  var gameOver;

  if(player.Health <= 0)                                        //game over if player hull is compromised
  {
    player.Health(0);
    gameOver = true;
  }
  else if(patientHealth <= 0)                                   //game over if too many pathogens get past the player and infect the patient
  {
    patientHealth = 0;
    gameOver = true;
  }
  else
  { 
    gameOver = false;
  }

  return gameOver;
}
//from view file
var view = {                                                //in game loop

  ticks : 0,                                                //tracks frames elapsed
  secs : 0,                                                 //tracks seconds elapsed
  mins : 0,                                                 //tracks minutes elapsed
  playerScore : 0,                                          //player's actual score
  displayedScore : 0,                                       //displayed score for score incrementation animation
  multiplier : 1,                                           //score multiplier
  
  updateViewPackage : function()
  {
    viewPackage.secs = view.secs;
    viewPackage.mins = view.mins;
    viewPackage.playerScore = view.playerScore;
    viewPackage.multiplier = view.multiplier;
    viewPackage.patientHealth = patientHealth;
  }
  ,
  update : function()                                     //MOVE TO SERVER, send info to clients
  {
    if(!endGame())                                          //while game isnt over, update game time, score and multplier
    {
      view.updateTimer();
      if(view.multiplier >= 9){view.multiplier = 9;}        //cap multiplier at 9
    }
    else{view.resetMultiplier();}
    view.updateViewPackage();  
  }
  ,
  updateTimer : function()                                  //MOVE TO SERVER, send info to clients
  {
    view.ticks++;                                           //ticks each frame at 60fps
    if(view.ticks >= 25)                                    //adjust to however many frames per sec the loop is at
    {
      view.secs++;
      view.ticks = 0;
    }
    if(view.secs >= 60)                                         
    {
      view.mins++;
      if(spawnRate > 1){spawnRate--;}                       //temp difficulty increase for each minute played.
      view.secs=0;
    }
  }
  ,
  resetMultiplier : function()
  {
    view.multiplier = 1;                                    //THIS NEED TO BE PART OF THE PLAYER EVENTUALLY
  }
  };                                                      //updated from CSE322 to use for CSE4050
  
var SOCKET_LIST = {};
//var PLAYER_LIST = {};
var playerConnected = false;
//var USERS = {};
//var DEBUG = true;
/*
function loadLoginData()
{
  fs.fileRead('login.json', function(data2){
  USERS = JSON.parse(data2);
  console.log('data read from login file');
})
}
var isValidPassword = function(data){
  loadLoginData();
  return USERS[data.username] === data.password;
}
var isUserNameTaken = function(data){
  loadLoginData();
  return USERS[data.name];
}
var addUser = function(data){
  loadLoginData();
  USERS[data.name] = data.password;
  var temp = JSON.stringify(USERS, null, 2);
  fs.writeFile('login.json', temp, function(err)
  {
    if(err){console.log(err);}
    else{console.log('data written to login file');}
  })
}
*/
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;
  console.log('socket connection');
//create game object socket object is session object
//put game object into game objects array by socket.id

/*
  socket.on('signIn', function(data){
    var valid; //placeholder
    //validate sign in against database
    if(valid)
    {  
      //create player
      socket.emit('signInResponse', {success:true});
    }
    else{socket.emit('signInResponse', {success:false});}
  })

  socket.on('signUp'), function(data){
    if(isUserNameTaken(data))
    {
      socket.emit('signupResponse', {success:false});
    }
    else
    {
      addUser(data);
      socket.emit('singUpResponse', {success:true});
    }
  }
*/
/*
  var player = Player(socket.id);
  PLAYER_LIST[socket.id] = player;
  console.log('new player created');
*/

  socket.on('disconnect', function(){
    delete SOCKET_LIST[socket.id];
    //delete game object for socket
  });

  function sendData()                              // loop through sockets to emit to specific socket. pass in socket id
  {
    socket.emit('playerLayer', playerObjects);
    socket.emit('objectLayers', layerObjects);
    socket.emit('viewLayer', viewPackage);
  }
  socket.on('playerInput', function(data){   //socket paired automatically by socket io.  update pressedKeys variable of socket's game object here
    pressedKeys = data;
  });

  socket.on('startGame', function(){                                     //in socket list loop, access corresponding game object's loop methods
    player = new Player(512, 384, 0, 0, 20, 10000, 100);

    //creates new player. params are x position, y position, x velocity, y velocity, density, scale, health
    playerObjects.push(player);

    makeLayers(numCanvases);

    setInterval(function(){
      randomizer = Math.random() - 0.5;                       //creates a random number between -0.5 and 0.5 to randomize various processes
                                                              //TODO refactor into function. maybe move into cleanup loop    
      cleanUpLoop();                                          //removes non-player objects from their arrays for gabage collection when off screen 
  
      spawnClock++                                            //temporary spawner delay to increase difficulty
      if(spawnClock==spawnRate)                               
      {
        spawnerLoop();                                        //loop that creates various game objects that are not the player
        spawnClock = 0;                                       //nor a player missile
      }


      handleInput();                                          //INPUT ON CLIENT. HANDLE INPUT EMITTED INPUT HERE
      updateLoop(intervalTime/1000);                          //update of all game objects
                                                              //TODO refactor collision process        
      collisionLoop();                                        //collision calculations among all collidable game objects that arent player or player weapons
  
      moveInZLoop();                                          //moves objects between canvas layers based on their z value
  
      view.update();
  
      sendData();                                                            //TRANSMIT DATA TO CLIENT

    },intervalTime);
  });
});
/*
  socket.on('sendMsgToServer', function(data){
    var playerName = socket.id;
    for(var i in SOCKET_LIST){
      SOCKET_LIST[i].emit('addToChat', playerName + ': ' + data);
    }
  });
*/
/*
  if(DEBUG)
  {
    socket.on('evalServer', function(data){
    var res = eval(data);
    socket.emit('evalAnswer', res);
    });
  }
});
*/
/*
setInterval(function(){
  var pack = [];
  for(var i in PLAYER_LIST){
  var player = PLAYER_LIST[i];
  pack.push({
    id:player.id,
    number:player.number
    });
  }
  for(var i in SOCKET_LIST){
    var socket = SOCKETLIST[i];
    socket.emit('newPositions', pack);
  }
},1000/25);
*/

