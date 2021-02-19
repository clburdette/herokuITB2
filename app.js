const { COPYFILE_FICLONE_FORCE } = require('constants');                            //VS Code added this. I'm not sure what it does.
const { SERVFAIL } = require('dns');
var express = require('express');                                                   //sets up express
var fs = require('fs');
var app = express();                                                                //creates express object and then links it to the client script
var serv = require('http').Server(app);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);                                              //starts server and allows it to be accessed either locally or by Heroku
console.log("server initialized");
                                                                                    //TODO move significant portions into other js files and reference from them for better organization

class GameSession                                                                   //object wrapper for game object. Made for multiplayer games
{                                                                                   //TODO get single player games working with this as well to simplify the server code
  constructor(player1, socket1)                                                         
  {
    this.game = null;
    this.player1 = player1;
    this.socket1 = socket1;
    this.player2 = null;
    this.socket2 = null;
    this.hasTwoPlayers = false;
  }
}

class Game                                                                          //game object.  allows games to be run as instances on the server
{                                                                                     
  constructor(playerPosX, playerPosY, isTwoPlayerGame)
  {
    this.numCanvases = 16;                                                          //defines amount of layers among play area objects
    this.spawnClock = 0;                                                            //temp variables to keep objects from spawning
    this.spawnRate = 10;                                                            //every frame, also increase difficulty
    this.isTwoPlayerGame = isTwoPlayerGame;                                         //for handling session joins and disconnects. may be redundant
    this.player = new Game.Player(playerPosX, playerPosY, 0, 0, 20, 10000, 100);    //player character object.  created when game instance is created  
    this.player2 = null;                                                            //player 2 object. initialized when 2nd player joins a GameSession
    this.playerObjects = [];                                                        //array that holds player(s) and all player-fired objects
    this.PLAYER_LIST = [];                                                          //list of players. not currently used, but may use it for expansion to modes with more players
    this.patientHealth = 1000;                                                      //health score metric for display
    this.randomizer;                                                                //variable for randomizing various processes
    this.layerObjects = [];                                                         //non-player objects
    this.gameOver = false;
    this.paused = false;                                                            //game over flag
    this.intervalTime = 20;                                                         //synch to time game loop for determining distances in reference to a single frame
    this.playerScore = 0;                                                           //player1's actual score
    this.playerScore2 = 0;                                                          //player2's actual score
    this.displayedScore = 0;                                                        //player1's displayed score
    this.displayedScore2 = 0;                                                       //player2's displayed score
    this.zDifficultyMultiplier = 1;                                                 //increases speed of movement for non-player object in the game's z-axis to increase difficutly over time
    this.multiplier = 1;                                                            //player1 score multiplier
    this.multiplier2 = 1;                                                           //player2 score multiplier
    this.tick = 0;                                                                  //for keeping track of time
    this.pressedKeys1 = {"a":false,"d":false,"s":false, "w":false, "m":false};      //player1 latest input info received
    this.pressedKeys2 = {"a":false,"d":false,"s":false, "w":false, "m":false};      //player2 latest input info received
    this.viewPackage = {                                                            //player1 UI information package to be sent to client
      playerScore : 0,                                                              //TODO run this info through a function that returns an object and then send
      multiplier : 1,
      patientHealth : 1000,
      tick: 0
    };
    this.viewPackage2 = {                                                           //player2 UI information package to be sent to client                                              
      playerScore : 0,                                          
      multiplier : 1,
      patientHealth : 1000,
      tick: 0
    };

    this.playerObjects.push(this.player);                                           //add player1 object to playerObjects array on Game instance creation

    this.makeLayers(this.numCanvases);                                              //creates the array that will hold the non-player objects for tracking and computation
  }


fire(owner)                                                                         //dynamically create missile at player's fire point in the direction of player's forward vector
{                                                                                   //refactor this out of game loop and into player object for multiplayer                       
  var spawn = new Game.Projectile(owner.xPos+owner.FirePointX, owner.yPos+owner.FirePointY, owner.FirePointX*30, owner.FirePointY*30, 10, 2, owner);
  this.playerObjects.push(spawn);                                                   //place in array with player objects so they dont collide with each other 
}

makeLayers(amount)                                                                  //fills the non player objects array with empty arrays that will be
{                                                                                   //used to hold dynamically created game objects at various z-axis levels
  for(var i=0; i < amount; i++)
  {
    var temp = [];
    this.layerObjects.push(temp);
  }

}
spawnToCollide(spawnXPos,spawnYPos,sizeToSpawn,objects)                             //checks to see if new object will collide with existing objects in a given layer
{
  var obj1;                                              
  var willCollide = false;
        
  for(var i=0; i < objects.length;i++)
  {
    obj1 = objects[i];
    if(Math.abs(spawnXPos-obj1.xPos)<=(sizeToSpawn + obj1.scale))                   //rough distance check based on X position
    {
      var diffX = spawnXPos-obj1.xPos;
      var diffY = spawnYPos-obj1.yPos;
      var sqDistance= Math.pow(diffX,2) + Math.pow(diffY,2);                        //if near in X, check actual distance between objects, and compare to combined radius

      if(sqDistance <= Math.pow(obj1.scale + sizeToSpawn,2)){willCollide = true;}
    }
  }

  return willCollide;
} 

spawner(objects)                                                                    //dynamically spawns objects using various random parameters within set ranges.
{                                                                                   //input parameter is an array of objects in a given layer, to which the spawned
  var randomX = Math.floor(Math.random() * 1024);                                   //object is added
  var randomY = Math.floor((Math.random() * 768)-10);
  var ranSize = Math.floor(Math.random() * 90) + 10;

  if(!this.spawnToCollide(randomX, randomY, ranSize, objects))
  {
    var randomZ;
    var ranXVel = Math.floor(Math.random() * 300)-150;
    var ranYVel = Math.floor(Math.random() * 200)-110;
    var ranZVel = Math.random() * 5;
    var ranDensity = Math.floor(Math.random() * 50) + 1;

    if(objects==this.layerObjects[this.numCanvases - 1])                            //assigns a Z position based on the layer of the objects in the input parameter array
    {
      randomZ = Math.floor(Math.random() * 5 + 100);
    }
    else
    {
      for(var i=0; i < this.layerObjects.length-1;i++)
      {
        if(objects==this.layerObjects[i])
        { 
          randomZ = Math.floor(Math.random() * (80/this.numCanvases)) + ((i+1)*(80/this.numCanvases));
        }
      }
    }
    var spawn = new Game.Entity(randomX, randomY, randomZ, ranXVel, ranYVel, ranZVel, ranSize, ranDensity);
    objects.push(spawn);                                                            //create new gameplay object and place into in the array for that layer based on z-position

  }
}

spawnerLoop()                                                                       //randomly chooses an array of objects from the "bottom" 6 game layers
{                                                                                   //and passes it into the spawner function
  var ranCanvas = Math.floor(Math.random() * 5);                                    //TODO rename function. This is not a loop.
  this.spawner(this.layerObjects[ranCanvas]);
}

cleanUpOffScreen(objects)                                                           //checks if objects have strayed too far off screen and removes them
{                                                                                   //from the appropriate object array, eliminating update of the given
  for(var i=0; i < objects.length; i++)                                             //object and allowing it to be garbage collected
  {
    var obj = objects[i];                                                           //objects completely off screen left, right and bottom.
    if((obj.xPos-obj.scale)>1024||                                                  //top allows some leeway for objects to leave play area
       (obj.xPos+obj.scale)<0||                                                     //and then return
       (obj.yPos-obj.scale)>768||
       (obj.yPos+obj.scale*10)<0)
    {
      if((obj.yPos-obj.scale)>768 && objects==this.layerObjects[this.numCanvases-1])
      {
        this.patientHealth -= obj.scale;                                            //effects patient health score and resets multiplier(s)
        if(obj.owner == this.player){ this.multiplier = 1;}                         //if object removed from past bottom of screen. (i.e. pathogen
        else if(obj.owner == this.player2){ this.multiplier2 = 1;}                  //will effect patient)
      }                                                                             
      objects.splice(i,1);                                                          
    }                                                                               
  }
}

cleanUpWeapons()                                                                    //removes player generated projectiles when too far off screen                       
{                                                                                   //so they no longer update and can be garbage collected
  var i;
  if(this.isTwoPlayerGame){i = 2;}
  else{i = 1;}
  for(i; i < this.playerObjects.length; i++)                                        //Allows leeway so projectiles can strike partially off screen
  {                                                                                 //objects. rename to cleanUpProjectiles    
    var obj = this.playerObjects[i];
    if((obj.xPos-100)>1024||
       (obj.xPos+100)<0||
       (obj.yPos-100)>768||
       (obj.yPos+100)<0)
    {
      if(obj.owner == this.player){ this.multiplier = 1;}
      else if(obj.owner == this.player2){ this.multiplier2 = 1;}
      this.playerObjects.splice(i,1);
    }
  }
}

cleanUpLoop()                                                                       //sends each layer object array into the clean up function
{
  this.cleanUpWeapons();

  for(var i=0;i<this.layerObjects.length;i++)
  { 
    this.cleanUpOffScreen(this.layerObjects[i]);
  } 
}

handleInput(keySet,playerToAccess)                                                  //handles input data originating from clients and adjusts player object position, orientation. and speed accordingly
{
  if(!keySet || keySet == null)
  { 
    keySet = {"a":false,"d":false,"s":false, "w":false, "m":false}; 
  }
  if(keySet["a"]&&keySet["d"]&&keySet["w"])                                         //forward no rotation when a,d,w pressed
  {
    playerToAccess.changeVel(0.01*playerToAccess.FirePointX,0.01*playerToAccess.FirePointY);    
  }
  else if(keySet["a"]&&keySet["w"])                                                 //forward and rotate left when a,w pressed
  {
    playerToAccess.changeAngle(-0.05);
    playerToAccess.changeVel(0.01*playerToAccess.FirePointX,0.01*playerToAccess.FirePointY); 
  }                                 
  else if(keySet["d"]&&keySet["w"])                                                 //forward and rotate right when d,w, pressed
  {
    playerToAccess.changeAngle(0.05);
    playerToAccess.changeVel(0.01*playerToAccess.FirePointX,0.01*playerToAccess.FirePointY);
  }
  else if(keySet["a"]&&keySet["s"])                                                 //backward and rotate left when a,s, pressed
  {
    playerToAccess.changeAngle(-0.02);
    playerToAccess.changeVel(-0.001*playerToAccess.FirePointX,-0.001*playerToAccess.FirePointY);
  }                                                       
  else if(keySet["d"]&&keySet["s"])                                                 //backward and rotate right when d,s, pressed
  {
    playerToAccess.changeAngle(0.02);
    playerToAccess.changeVel(-0.001*playerToAccess.FirePointX,-0.001*playerToAccess.FirePointY); 
  }                                                       
  else if(keySet["a"])                                                              //rotate left when a only pressed
  {
    playerToAccess.changeAngle(-0.1);
  }
  else if(keySet["d"])                                                              //rotate right when d only pressed
  {
    playerToAccess.changeAngle(0.1);
  }
  else if(keySet["s"])                                                              //backward when s only pressed
  {
    playerToAccess.changeVel(-0.001*playerToAccess.FirePointX,-0.001*playerToAccess.FirePointY)               
  }
  else if(keySet["w"])                                                              //forward when w only pressed
  {
    playerToAccess.changeVel(0.01*playerToAccess.FirePointX,0.01*playerToAccess.FirePointY);             
  }
  if(keySet["m"]){ this.fire(playerToAccess); }
}

updateLoop(delta, zMultiplier)                                                      //first input parameter is amount of time which has passed during a given frame
{                                                                                   //which is then passed into the update function of each object in the game
  for(var i=0; i < this.playerObjects.length; i++)                                  //second is temp multiplier for adjusting difficulty over time 
  {
    this.playerObjects[i].update(delta);                                            //updates player(s) and all player generated projectiles
  }  

  for(var i=0; i < this.layerObjects.length; i++)                                   //updates each object in a given layer one at a time, one layer at
  {                                                                                 //time until all non-player objects are updated
    var group = this.layerObjects[i];
    for(var j=0; j < group.length; j++)
    {
      group[j].update(delta, zMultiplier);
    }  
  }
}

moveInZ(objects)                                                                    //moves objects between the various layer object arrays based on their Z position value
{                                                                                   //provides the illusion of movement in the 3rd spatial direction.
  for(var i = 0; i < objects.length; i++)                                           //input parameter is an array of objects rendering in a given layer
  {                                                                                 //TODO bool or early check so n-squared algorithm isnt necessary for objects that wont be moving
    for(var j = 0; j < this.layerObjects.length; j++)
    {
      if(objects[i].zPos < (j+1)*(80/this.numCanvases) && (j+1)*(80/this.numCanvases) < 80)  //the z position zone of the numCanvases-1 bottom layers
      {
        this.layerObjects[j].push(objects[i]);                                      //adds object to the object array for that layer
        objects.splice(i,1);                                                        //removes object from previous layer
        j = this.layerObjects.length;                                               //exits loop
      }
      else if(objects[i].zPos >= (80 - (80/this.numCanvases)))                      //special case for state for top layer where player objects reside
      {                                                                             //TODO figure out collision between players if that ends up being desireable  
        if(objects[i].yPos < 600)                                                   //keeps objects from pushing into the top layer at the bottom of the screen
        {
          this.layerObjects[this.numCanvases-1].push(objects[i]);
          objects.splice(i,1);
          j = this.layerObjects.length;
        }
      }
    }
  }              
}

moveInZLoop()                                                                       //sends all of the layer object arrays into the moveInZ function to be checked
{
  for(var i=0; i < this.layerObjects.length;i++)
  {
    this.moveInZ(this.layerObjects[i]);
  }
}

detectCollision(objects)                                                           //detects collision between all collidable objects in a given layer object array
{                                                                                  //input parameter is a layer object array
                                                                                                         
  for(var i=0; i < objects.length;i++)                                             //resets each object's variable that indicates if the object is colliding with something else during a given frame
  {
    objects[i].isColliding = false;
  }

  for(var i=0; i < objects.length;i++)                                             //compares each object with every other object in the layer object array
  {

    for(var j=i+1; j < objects.length;j++)
    {
      if((Math.abs(objects[i].xPos-objects[j].xPos)) <= (objects[i].scale + objects[j].scale))
      {                                                                           //check to see if objects are near each other in X before doing more computationally heavy
        this.collisionReaction(objects,i,j);                                      //checks for collision
      }                                                                           //TODO double this up to check for Y
    }
  }
}

playerCollision(objects)                                                          //detects collision between player(s) and player projectiles with top layer objects
{
  var obj1;
  var obj2;
                                            
  for(var i=0; i < this.playerObjects.length;i++)                                 //resets each player(s) object's variable that indicates if the object is colliding with something
  {                                                                               //else during a given frame
    this.playerObjects[i].isColliding = false;
  }
                                                   
  for(var i=0; i < objects.length;i++)                                            //same for all non-player objects
  {
    objects[i].isColliding = false;
  }

  for(var i=0; i < this.playerObjects.length; i++)
  {
    obj1 = this.playerObjects[i];
    for(var j=0; j < objects.length;j++)                                          //compares each object with player(s) and/or player projectiles
    {
      obj2 = objects[j];
      if((Math.abs(obj1.xPos-obj2.xPos)) <= (obj1.scale + obj2.scale))            //filters checks for collision based on X position
      {                                                                           //TODO add Y position check as well.
        var deltaX = obj2.xPos-obj1.xPos;
        var deltaY = obj2.yPos-obj1.yPos;
        var sqDistance= Math.pow(deltaX,2) + Math.pow(deltaY,2);
        if(sqDistance <= (Math.pow(obj1.scale + obj2.scale,2)))                   //checks to see if the distance between two objects is less than equal to their combined radii
        {                                                                         //thereby indicating a collision.
          obj1.isColliding=true;                                                  //makes various physics calculations based on the parameters on the two objects in the collision
          obj2.isColliding=true;                                                  //TO DO move into a function  
          var vNorm = {x: deltaX/Math.sqrt(sqDistance), y: deltaY/Math.sqrt(sqDistance)};
          var vRelVel = {x: obj1.xVel-obj2.xVel, y: obj1.yVel-obj2.yVel};
          var speed = (vRelVel.x * vNorm.x) + (vRelVel.y * vNorm.y);
          if (speed < 0){speed = 0;}
          var impulse = 2* speed / ((obj1.scale*obj1.density) + (obj2.scale*obj2.density));
          obj1.xVel -= (impulse*obj2.scale*obj2.density*vNorm.x);
          obj1.yVel -= (impulse*obj2.scale*obj2.density*vNorm.y);
          obj2.xVel += (impulse*obj1.scale*obj1.density*vNorm.x);
          obj2.yVel += (impulse*obj1.scale*obj1.density*vNorm.y);                     
          obj2.scale-=obj1.scale;
          if(sqDistance/(Math.pow(obj1.scale + obj2.scale,2)) < 0.9)
          {
            var midPoint = {x: (obj2.xPos+obj1.xPos)/2, y: (obj2.yPos+obj1.yPos)/2};
            var distOne = Math.pow((midPoint.x - obj1.xPos),2) + Math.pow((midPoint.y - obj1.yPos),2);
            var distTwo = Math.pow((midPoint.x - obj2.xPos),2) + Math.pow((midPoint.y - obj2.yPos),2);
            var vecOne = {x: (obj1.xPos - midPoint.x)/distOne, y: (obj1.yPos - midPoint.y)/distOne};
            var vecTwo = {x: (obj2.xPos - midPoint.x)/distTwo, y: (obj2.yPos - midPoint.y)/distTwo};
            obj1.xVel += (vecOne.x/obj1.scale)*1000;
            obj1.yVel += (vecOne.y/obj1.scale)*1000;
            obj2.xVel += (vecTwo.x/obj2.scale)*1000;
            obj2.yVel += (vecTwo.y/obj2.scale)*1000;
          }
          if(this.isTwoPlayerGame)                                                //handles player scoring based one game type
          {                                                                       //TODO refactor into something less messy  
            if(i>1)
            {
              if(!this.endGame())
              {
                if(this.playerObjects[i].owner == this.player){this.playerScore += Math.ceil(1000/obj2.scale) * this.multiplier;}
                else if(this.playerObjects[i].owner == this.player2){this.playerScore2 += Math.ceil(1000/obj2.scale) * this.multiplier2;}
              }
              if(this.playerObjects[i].owner == this.player){this.multiplier++;}
              else if(this.playerObjects[i].owner == this.player2){this.multiplier2++;}                                                                                  
              this.playerObjects.splice(i,1);
              if(obj2.scale > 60)
              {                                                                   //large gameplay objects split in two when hit
                var randomizeXPos = ((Math.random() * obj2.scale * Math.sqrt(2)) - obj2.scale/Math.sqrt(2)) * this.randomizer;
                var randomizeYPos = ((Math.random() * obj2.scale * Math.sqrt(2)) - obj2.scale/Math.sqrt(2)) * this.randomizer;
                var randomizeXVel = ((Math.random() * obj2.scale * Math.sqrt(2)) - obj2.scale/Math.sqrt(2)) * this.randomizer;
                var randomizeYVel = ((Math.random() * obj2.scale * Math.sqrt(2)) - obj2.scale/Math.sqrt(2)) * this.randomizer;
                var spawn = new Game.Entity((obj2.xPos)+randomizeXPos, (obj2.yPos)+randomizeYPos, obj2.zPos, (obj2.xVel)+randomizeXVel, (obj2.yVel)+randomizeYVel, obj2.zVel, Math.ceil((obj2.scale)/Math.sqrt(2)), obj2.density);
                obj2.scale = Math.ceil(obj2.scale/Math.sqrt(2));
                objects.push(spawn);
              }
            }
            else if( i == 0 ){this.multiplier = 1;}                               //multipier resets when player character object hits gameplay "enemy" object
            else if( i == 1 ){this.multiplier2 = 1;}                                                                                 
            if(obj2.scale<10){objects.splice(j,1);}
          }
          else
          {
            if(i>0)
            {
              if(!this.endGame())
              {
                this.playerScore += Math.ceil(1000/obj2.scale) * this.multiplier;
                this.multiplier++;
              }                                                                                 
              this.playerObjects.splice(i,1);
              if(obj2.scale > 60)
              {
                var randomizeXPos = ((Math.random() * obj2.scale * Math.sqrt(2)) - obj2.scale/Math.sqrt(2)) * this.randomizer;
                var randomizeYPos = ((Math.random() * obj2.scale * Math.sqrt(2)) - obj2.scale/Math.sqrt(2)) * this.randomizer;
                var randomizeXVel = ((Math.random() * obj2.scale * Math.sqrt(2)) - obj2.scale/Math.sqrt(2)) * this.randomizer;
                var randomizeYVel = ((Math.random() * obj2.scale * Math.sqrt(2)) - obj2.scale/Math.sqrt(2)) * this.randomizer;
                var spawn = new Game.Entity((obj2.xPos)+randomizeXPos, (obj2.yPos)+randomizeYPos, obj2.zPos, (obj2.xVel)+randomizeXVel, (obj2.yVel)+randomizeYVel, obj2.zVel, Math.ceil((obj2.scale)/Math.sqrt(2)), obj2.density);
                obj2.scale = Math.ceil(obj2.scale/Math.sqrt(2));
                objects.push(spawn);
              }
            }
            if( i == 0 ){this.multiplier = 1;}                                                                               
            if(obj2.scale<10){objects.splice(j,1);}
          }
        }
      }
    }
  }
}
collisionReaction(objs,i,j)                                                      //simulated physics on collision
{
      var obj1 = objs[i];
      var obj2 = objs[j];
      var deltaX = obj2.xPos-obj1.xPos;
      if(deltaX <= obj1.scale + obj2.scale)
      var deltaY = obj2.yPos-obj1.yPos;
      var sqDistance= Math.pow(deltaX,2) + Math.pow(deltaY,2);
      var overlap = sqDistance/(Math.pow(obj1.scale + obj2.scale,2));
      if(overlap <= 1)                                                          //checks to see if the distance between two objects is less than equal to their combined radii
      {                                                                         //thereby indicating a collision.
        obj1.isColliding=true;                                                  //makes various physics calculations based on the parameters on the two objects in the collision
        obj2.isColliding=true;                                                  //TO DO move into a function
        var midPoint = {x: (obj2.xPos+obj1.xPos)/2, y: (obj2.yPos+obj1.yPos)/2};
        if((obj1.scale + obj2.scale) < 70 && overlap < 0.98)                    //small objects that collide and sufficiently overlap combine into a larger object
        {
          var obj1Mass = obj1.scale*obj1.scale*obj1.density;
          var obj2Mass = obj2.scale*obj2.scale*obj2.density;
          var obj1Momen = {x: obj1.xVel*obj1Mass, y: obj1.yVel*obj1Mass};
          var obj2Momen = {x: obj2.xVel*obj2Mass, y: obj2.yVel*obj2Mass};
          var obj3Vel = {x: (obj1Momen.x + obj2Momen.x)/(obj1Mass + obj2Mass), y: (obj1Momen.y + obj2Momen.y)/(obj1Mass + obj2Mass)}; 
          var spawn = new Game.Entity(midPoint.x, midPoint.y, (obj1.zPos + obj2.zPos)/2, obj3Vel.x, obj3Vel.y, (obj1.zVel + obj2.zVel)/2, Math.ceil((obj1.scale + obj2.scale)/Math.sqrt(2)),
                                ((((Math.pow(obj1.scale,2) * obj1.density) + (Math.pow(obj2.scale,2) * obj2.density))) / (Math.pow(obj1.scale + obj2.scale,2))));
          if(i<j)
          {                                                                     //uses position in array to determine correct order of removal
            objs.splice(j,1);
            objs.splice(i,1);
          }
          else
          {
            objs.splice(i,1);
            objs.splice(j,1);
          }
          objs.push(spawn);                                                    //add new combined object to object array 
        }
        else
        {
          if(overlap > 0.95)                                                   //large objects with not much overlap on collision will bounce off each other
          {
            this.collisionPhys(deltaX, deltaY, sqDistance, obj1, obj2); 
          }
          else if(overlap <=0.95)                                              //large objects with more overlap will react more violently, accelerating apart 
          {                                                                    //until no longer overlapping
            var distOne = Math.pow((midPoint.x - obj1.xPos),2) + Math.pow((midPoint.y - obj1.yPos),2);
            var distTwo = Math.pow((midPoint.x - obj2.xPos),2) + Math.pow((midPoint.y - obj2.yPos),2);
            var vecOne = {x: (obj1.xPos - midPoint.x)/distOne, y: (obj1.yPos - midPoint.y)/distOne};
            var vecTwo = {x: (obj2.xPos - midPoint.x)/distTwo, y: (obj2.yPos - midPoint.y)/distTwo};
            obj1.xVel += (vecOne.x/obj1.scale)*1000;
            obj1.yVel += (vecOne.y/obj1.scale)*1000;
            obj2.xVel += (vecTwo.x/obj2.scale)*1000;
            obj2.yVel += (vecTwo.y/obj2.scale)*1000;
          }        
        }
      }
}

collisionPhys(dX,dY,sqDist,o1,o2)                                             //takes the forward momentum of the two objects and determines what their direction
{                                                                             //and velocity should be after collision.
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
collisionLoop()                                                               //sends each layer object array into the collision detection function
{
  this.playerCollision(this.layerObjects[this.numCanvases-1]);

  for(var i=0; i < this.layerObjects.length;i++)
  {
    this.detectCollision(this.layerObjects[i]);
  }
}

endGame()                                                                     //checks conditions for game being over
{                                                                             
  var gameOver = false;

  if(this.player.health <= 0)                                                 //game over if player(s) hull is compromised
  {
    this.player.health = 0;
    gameOver = true;
  }
  else if(this.isTwoPlayerGame && this.player2.health <= 0)
  {
    this.player2.health = 0;
    gameOver = true;
  }
  else if(this.patientHealth <= 0)                                            //game over if too many pathogens get past the player and infect the patient
  {
    this.patientHealth = 0;
    gameOver = true;
  }

  return gameOver;
}

  updateViewPackage()                                                         //updates variables to be sent to client in ui layer package(s)
  {
    this.viewPackage.playerScore = this.playerScore;
    this.viewPackage.multiplier = this.multiplier;
    this.viewPackage.patientHealth = this.patientHealth;
    this.viewPackage.tick = this.tick;
    this.viewPackage2.playerScore = this.playerScore2;
    this.viewPackage2.multiplier = this.multiplier2;
    this.viewPackage2.patientHealth = this.patientHealth;
    this.viewPackage2.tick = this.tick;
  }
  
  viewUpdate()                                                                //caps multipliers
  {                                                                           //TODO rename. Has to be a better place for this
    if(!this.endGame())                                          
    {
      if(this.multiplier >= 9){this.multiplier = 9;}
      if(this.multiplier2 >= 9){this.multiplier2 = 9;}           
    }
    else
    {
      this.multiplier = 1;
      this.multiplier2 = 1;
      this.gameOver = true;                                                   //this is redundant
    }
    this.updateViewPackage();  
  }
}

  Game.Entity = class                                                         //anything in the game that collides except for player characters
  {                                                                           
                                                                                         
    constructor(xPos, yPos, zPos, xVel, yVel, zVel, scale, density)            
    {                                                                                       
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
  
    draw()                                                                    //determines where the object resides and draws it
    {                                                                         //TODO remove this. Left over from client version          
      if(this.context==contextBag[numCanvases-1])                                        
      {
        this.context.fillStyle = '#440033';
      }
      else
      {
        for(var i = 0; i < numCanvases; i++)
        {
          if(this.context==contextBag[numCanvases-1-i])                                  
          {                                                                              
            var num = (256/numCanvases)*i;                                              
            var color = '#' + num.toString(16) + '0000';                                
            this.context.fillStyle = color;                                             
          }
        }
      }
      this.context.beginPath();                                                                                  
      this.context.arc(this.xPos, this.yPos, this.scale, 0, 2*Math.PI);
      this.context.fill();
    }
  
    update(seconds, zMultiplier)                                               //updates velocity and position of object 
    {
      if(this.xVel != 0){this.xVel*=0.999;}                                    //friction, slowing velocity in all directions over time
      if(this.yVel != 0){this.yVel*=0.999;}
      if(this.zVel != 0){this.zVel*=0.999;}	
      this.yVel += 0.1;                                                        //simulates blood flow, moving objects toward bottom screen
      this.xPos += this.xVel*seconds;                                          //position updated by velocity during that frame
      this.yPos += this.yVel*seconds;                                          //in each spatial direction
      this.zPos += this.zVel*seconds*zMultiplier;
    }
  };
  
  Game.Projectile = class                                                      //emitted object which does not collide with players
  {                                                                            //and only operates within one canvas. no Z-movement.
                                                                                       
    constructor(xPos, yPos, xVel, yVel, scale, density, owner)
    {
      this.xPos=xPos;
      this.yPos=yPos;
      this.xVel=xVel;
      this.yVel=yVel;
      this.scale=scale;
      this.density=density;
      this.owner = owner;
    }
  
    draw()                                                                     //TODO remove this. happens on client
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
  };
  
  Game.Player = class                                                              //player character object.
  {                                                                                
                                                                                  
    constructor(xPos, yPos, xVel, yVel, scale, density, health)            
    {                                                                               
                                                           
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
      this.MAX_MAG=25;                                                             //maximum velocity of player object                                                            
    }
   
    draw()                                                                        //TODO upgrade player appearance
    {                                                                             //TODO remove this function. takes place on client.    
      this.context.save();
      this.context.translate(this.xPos, this.yPos);                               
      this.context.fillStyle = '#FFAA00';                                          
      this.context.beginPath();                                                   
      this.context.arc(this.FirePointX/-2, this.FirePointY/-2, 14, 0, 2*Math.PI);
      this.context.fill();
      this.context.fillStyle = '#0000FF';                                         
      this.context.beginPath();
      this.context.arc(this.FirePointX, this.FirePointY, 4, 0, 2*Math.PI);
      this.context.fill();
      this.context.rotate(this.angle);                                            
      this.context.fillStyle = '#00FF00';                                         
      this.context.beginPath();                                                   
      this.context.arc(0, 0, this.scale, 0, 2*Math.PI);                           
      this.context.fill();                                                        
      if(this.isColliding)                                                        
      {
        this.context.fillStyle = '#FF0000';                                       
        this.context.beginPath();                                                 
        this.context.arc(0, 0, this.scale, 0, 2*Math.PI);     
        this.context.fill();
        this.health--;
      }
      this.context.restore();          
    }
  
    changeVel(xValue, yValue)                                                     //TODO figure out what I was doing here
    {
      this.xVel += xValue;
      this.yVel += yValue;
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
      if(this.isColliding){this.health--;}
    }
  }; 


var SOCKET_LIST = {};                                                             //Server variables used by the sockets
var USER_LIST = {};
var GAME_LIST = {};
var SESSION_LIST = {};
var serverIntervalTime = 20;
var connections = 0;
var activeGames = 0;
var activeSessions = 0;
var activeSinglePlayerGames = 0;
var activeTwoPlayerGames = 0;
var twoPlayerOpenings = 0;
var MAX_CONNECTIONS = 10;
var DEBUG = false;

var io = require('socket.io')(serv,{});                                           //sets up socket.io on the server
io.sockets.on('connection', function(socket){                                     //when a new client connects, a socket is created for it and that socket is placed in an array for access
  socket.id = Math.random();                                                      //various other variables track states and conditions of the socket
  socket.gameCreated = false;
  socket.hostingSession = false;
  socket.gameOverSent = false;
  socket.inTwoPlayerGame = false;
  socket.currentSession = null;
  socket.playerID = "";
  var USERS;
  SOCKET_LIST[socket.id] = socket;
  console.log('socket connection');
  connections++;

  socket.on('signIn', function(data){                                             //sign in and sign up signal and data handling

    fs.readFile('./login.json', (err, data2) => {                                 //reads login info json file and compares it to data
      if(err)
      {                                                                           //TODO move from JSON file to cloud based database for better security
        console.log("error reading file");
      }
      else
      {
        USERS = JSON.parse(data2);
        console.log('data read from login file. id: ' + socket.id);
      }
      if(USERS[data.username] && USERS[data.username] === data.password)
      {  
        socket.playerID = data.username;
        USER_LIST[socket.id] = socket.playerID;
        socket.emit('signInResponse', {success:true});                            //send response to client
      }
      else{socket.emit('signInResponse', {success:false});}
      USERS = {};                                                                 //clears temp user data, keeping JSON file data encapsulated
    });
  });

  socket.on('signUp', function(data){
    fs.readFile('./login.json', (err, data2) => {                                 //reads JSON file and checks against data from client
      if(err)
      {
        console.log("error reading file");       
      }
      else
      {
        USERS = JSON.parse(data2);
        console.log('data read from login file. id: ' + socket.id);
      }

      if(USERS[data.username])
      {
        socket.emit('signUpResponse', {success:false});
        USERS = {};
      }
      else
      {
        USERS[data.username] = data.password;
        var temp = JSON.stringify(USERS, null, 2);
        fs.writeFile('./login.json', temp, function(err)                          //writes new user to JSON login file
        {
          if(err){console.log("error writing file");}
          else{console.log('data written to login file. id: ' + socket.id);}
          socket.emit('singUpResponse', {success:true});
          USERS = {};
        });
      }
    });
  });

  function gameStartup()                                                          //creates new single player game
  {
    var singlePlayerSession = new GameSession(USER_LIST[socket.id], SOCKET_LIST[socket.id]);
    singlePlayerSession.game = new Game(512, 384, false);
    socket.currentSession = singlePlayerSession;
    socket.hostingSession = true;
    SESSION_LIST[socket.id] = singlePlayerSession;
    GAME_LIST[socket.id] = singlePlayerSession.game;
    console.log("game session created");
    console.log("game instance running");
    socket.gameCreated = true;
    socket.emit("gameStarted");
    activeGames++;
    activeSessions++;
    activeSinglePlayerGames++;
    console.log(connections + " connections active");
    console.log(activeGames + " games active");
  }

  function twoPlayerSessionStartup()                                              //creates new session to host 2 player game                                            
  {
    var hostedSession = new GameSession(USER_LIST[socket.id], SOCKET_LIST[socket.id]);
    SESSION_LIST[socket.id] = hostedSession;
    console.log("game session created");
    socket.currentSession = hostedSession;
    socket.hostingSession = true;
    socket.emit("twoPlayerSessionStarted");
    twoPlayerOpenings++;
    activeSessions++;
    console.log(connections + " connections active");
    console.log(activeGames + " games active");
  }

  socket.on("gamePaused", function(){
    if(GAME_LIST[socket.id])
    {
        GAME_LIST[socket.id].paused = true;
        if(GAME_LIST[socket.id].isTwoPlayerGame)
        {
          socket.currentSession.socket2.emit("sessionAbandoned");
        }
    }
    else
    {
      if(SESSION_LIST[socket.id])
      {
        console.log("error: game not found")
      }
      else
      {
        socket.currentSession.game.paused = true;
        socket.currentSession.socket1.emit("sessionAbandoned");
      }
    }
    console.log("game paused server side");
  });

  socket.on("continueGame", function(){
    socket.currentSession.game.paused = false;
  });

  socket.on("sessionReset", function(){                                           //resets socket after 2 player session has concluded
    if(SESSION_LIST[socket.id])
    {
      delete GAME_LIST[socket.id];
      delete SESSION_LIST[socket.id];
      activeGames--;
      activeSessions--;   
    }
    socket.gameCreated = false;
    socket.gameOverSent = false;
    socket.inTwoPlayerGame = false;
    socket.hostingSession = false;
    socket.currentSession = null;
    console.log("game ended");
    console.log("session ended");
    console.log(connections + " connections active");
    console.log(activeGames + " games active");
  });

  socket.on('disconnect', function(){                                             //things that occur when a player closes their browser window  
    if(!SESSION_LIST[socket.id])
    {
      if(socket.currentSession)                                                   //nullifies 2nd player portion of a session and notifies session host
      { 
        /*                                                                          //when player number2(guest) leaves early
        socket.currentSession.game.isTwoPlayerGame = false;
        socket.currentSession.game.gameOver = true;
        socket.currentSession.player2 = null;
        socket.currentSession.socket2 = null;
        */
        socket.currentSession.game.paused = true;
        socket.currentSession.socket1.emit("sessionAbandoned");
        //console.log("player 2 dropped out");
        //activeTwoPlayerGames--;
      }        
    }
    else
    {
      if(SESSION_LIST[socket.id].hasTwoPlayers)                                    //ends game and session when session host drops out and notifies guest player                                 
      {
        socket.currentSession.game.paused = true;
        SESSION_LIST[socket.id].socket2.emit("sessionAbandoned");
        /*
        delete GAME_LIST[socket.id];
        delete SESSION_LIST[socket.id];
        activeTwoPlayerGames--;
        console.log("2 player game deleted");
        */
      }
      else                                                                        //ends single player game and removes it from game list  
      {
        delete GAME_LIST[socket.id];
        delete SESSION_LIST[socket.id];
        activeGames--;
        activeSinglePlayerGames--;
        console.log("1 player game deleted");
      }
      //activeGames--;
      //activeSessions--;
    }
    socket.gameOverSent = true;                                                   //logs and completes disconnection
    connections--;
    console.log("disconnection");
    console.log(connections + " connections active");
    delete USER_LIST[socket.id];
    delete SOCKET_LIST[socket.id];
  });

  socket.on('playerInput', function(data){                                        //input from client processed and set to approriate Game object for use in the game loop
    if(socket.inTwoPlayerGame)
    {
      if(socket.hostingSession)
      {
        GAME_LIST[socket.id].pressedKeys1 = data;
      }
      else
      {
        socket.currentSession.game.pressedKeys2 = data;
      }
    }
    else
    {
      if(GAME_LIST[socket.id]){GAME_LIST[socket.id].pressedKeys1 = data;}
    }
  });

  socket.on('startGame', function(){                                             //receives and processes start single player game signal from client 
    if(connections <= MAX_CONNECTIONS && !socket.gameCreated)
    {  
      gameStartup();
    }
    else
    {
      socket.emit('serverFull');
    }
  });

  socket.on('startTwoPlayerGame', function(){                                    //receives and processes start two player game signal from client
    if(connections <= MAX_CONNECTIONS && !socket.gameCreated)
    {  
      if(twoPlayerOpenings == 0)                                                 //checks to see if anyone is waiting for a two player GameSession to be filled 
      {                                                                          //if not, creates one and makes this socket the host 
        twoPlayerSessionStartup();
      }
      else                                                                       //if a session is waiting, creates games and places game and 2nd player into the GameSession 
      {
        var tempSession;
        for(var i in SESSION_LIST)
        {
          if(SESSION_LIST[i] && !SESSION_LIST[i].hasTwoPlayers)
          {
            SESSION_LIST[i].game = new Game( 340, 384, true);
            SESSION_LIST[i].game.player2 = new Game.Player(684, 384, 0, 0, 20, 10000, 100);
            SESSION_LIST[i].game.playerObjects.push(SESSION_LIST[i].game.player2);
            SESSION_LIST[i].game.isTwoPlayerGame = true;                        //adds necessary info to the GameSession object so both clients can access it
            SESSION_LIST[i].hasTwoPlayers = true;
            SESSION_LIST[i].player2 = USER_LIST[socket.id];
            SESSION_LIST[i].socket2 = SOCKET_LIST[socket.id];
            GAME_LIST[SESSION_LIST[i].socket1.id] = SESSION_LIST[i].game
            SESSION_LIST[i].socket1.gameCreated = true;
            tempSession = SESSION_LIST[i];
            break;
          }
        }
        twoPlayerOpenings--;                                                    //signals both clients that the game has started and raises necessary flags, logs
        tempSession.socket1.emit('twoPlayerGameStarted');
        tempSession.socket1.inTwoPlayerGame = true;
        tempSession.socket2.emit('twoPlayerGameStarted');
        tempSession.socket2.inTwoPlayerGame = true;
        tempSession.socket2.currentSession = tempSession;
        activeGames++;
        socket.inTwoPlayerGame = true;
        console.log(activeGames + " games active");
      }                                                             
    }
    else
    {
      socket.emit('serverFull2');
    }
  });

  socket.on('endGame', function(){                                              //resets socket on end game signal from a client
    if(socket.gameCreated)
    {
      delete GAME_LIST[socket.id];
      activeGames--;
      console.log("game ended");
    }
    socket.gameCreated = false;
    socket.hostingSession = false;
    socket.inTwoPlayerGame = false;
    socket.currentSession = null;
    console.log(connections + " connections active");
    console.log(activeGames + " games active");
    socket.emit("gameOver");
    socket.gameOverSent = true;
  });

  socket.on('sendMsgToServer', function(data){                                //for planned chat feature
    var playerName = socket.id;
    for(var i in SOCKET_LIST){
      SOCKET_LIST[i].emit('addToChat', playerName + ': ' + data);
    }
  });

  if(DEBUG)
  {
    socket.on('evalServer', function(data){
    var res = eval(data);
    socket.emit('evalAnswer', res);
    });
  }
});
    
  setInterval(function(){                                                     //server loop
    for(var i in SOCKET_LIST)
    {
      var socket = SOCKET_LIST[i];                                            //loops through all connected sockets and checks if any of them have any associated Game object
      if(socket.hostingSession)
      {
        var session = SESSION_LIST[socket.id];
        var game = session.game
        if(game)
        {
          if(!game.gameOver)                                                    //if a game exists and it isnt over, game loop for this frame of this game commences
          {
            if(!game.paused)
            {
              game.tick++;

            if(game.tick >= 6000)                                               //tick to keep displayed game clock even with loop
            {                                                                   //TODO get rid of magic number
              game.zDifficultyMultiplier += 0.1;                                //temp difficult adjustment stuff
              if(game.spawnRate > 1)
              {
                game.spawnRate--;
                game.zDifficultyMultiplier += 0.1;
                game.tick = 0;
                game.spawnClock = 0;
              }
            }

            game.randomizer = Math.random() - 0.5;                             //creates a random number between -0.5 and 0.5 to randomize various processes
                                                                             //TODO refactor into function. maybe move into cleanup loop    
            game.cleanUpLoop();                                                //removes non-player objects from their arrays for gabage collection when off screen 
  
            game.spawnClock++
                                                                             //temporary spawner delay to increase difficulty
            if(game.spawnClock==game.spawnRate)                               
            {
              game.spawnerLoop();                                              //loop that creates various game objects that are not the player nor a player missile
              game.spawnClock = 0;                                            
            }
            game.handleInput(game.pressedKeys1,game.player);                   //adjusts player information based on input data receive from client
            if(game.isTwoPlayerGame){game.handleInput(game.pressedKeys2,game.player2);}

            game.updateLoop(game.intervalTime/1000, game.zDifficultyMultiplier);//update of all game objects
                                                                             //TODO refactor collision process        
            game.collisionLoop();                                              //collision calculations among all collidable game objects that arent player or player weapons
  
            game.moveInZLoop();                                                //moves objects between layers based on their z value
  
            game.viewUpdate();                                                 //updates varaibles having to do with UI on the client
                                                                             //TODO rename
            socket.emit('playerLayer', game.playerObjects);                    //send data packages to the client(s)
            socket.emit('objectLayers', game.layerObjects);                    //TODO refactor this into a loop when going beyond 2 player session
            socket.emit('viewLayer', game.viewPackage);
            if(game.isTwoPlayerGame)
            {
              session.socket2.emit('playerLayer', game.playerObjects);
              session.socket2.emit('objectLayers', game.layerObjects);
              session.socket2.emit('viewLayer', game.viewPackage2);
            }
          }
        }
        else if(!socket.gameOverSent)                                        //when game is over on server, send signal to client(s)
        {
          socket.emit('gameOver');                                           //TODO refactor into loop for more than 2 players
          if(game.isTwoPlayerGame){session.socket2.emit('gameOver');}
          socket.gameOverSent = true;
        }
      }                                                           
      }
    }
  },serverIntervalTime);
//although mostly heavily altered or original, some of this script is from YouTube tutorials by YT user ScriptersWar, specifically the "Create Your Own HTML5 Multiplayer Game" series.




