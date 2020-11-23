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
class Game
{
  constructor()
  {
    this.numCanvases = 16;                                          //defines amount of layers among play area objects
    this.spawnClock = 0;                                            //temp variables to keep objects from spawning
    this.spawnRate = 10;                                            //every frame, also increase difficulty
    this.player = new Game.Player(512, 384, 0, 0, 20, 10000, 100);                                                    //player character object
    this.playerObjects = [];                                        //array that holds player and all player-fired objects
    this.PLAYER_LIST = [];                                          //duplicated in TUT
    this.patientHealth = 1000;                                      //health score metric for display
    this.randomizer;                                                //variable for randomizing various processes
    this.layerObjects = [];
    this.gameOver = false;
    this.intervalTime = 20;                                                 //tracks minutes elapsed
    this.playerScore = 0;                                          //player's actual score
    this.displayedScore = 0;
    this.zDifficultyMultiplier = 1;                                       //displayed score for score incrementation animation
    this.multiplier = 1;
    this.tick = 0;                                           //score multiplier
    this.pressedKeys = {"a":false,"d":false,"s":false, "w":false, "m":false};
    this.viewPackage = {                                                //in game loop                                                //tracks frames elapsed
      playerScore : 0,                                          //player's actual score                                      //displayed score for score incrementation animation
      multiplier : 1,
      patientHealth : 1000,
    };

    this.playerObjects.push(this.player);

    this.makeLayers(this.numCanvases);
  }


fire()                                           //dynamically create missile at player's fire point in the direction of player's forward vector
{                                                         //refactor this out of game loop and into player object for multiplayer                        
  var spawn = new Game.Projectile(this.player.xPos+this.player.FirePointX, this.player.yPos+this.player.FirePointY, this.player.FirePointX*30, this.player.FirePointY*30, 10, 2);
  this.playerObjects.push(spawn);                              //place in array with player objects so they dont collide with each other 
}

makeLayers(amount)                              //fills the canvasObjects array with empty arrays that will be
{                                                          //used to hold dynamically created game objects
  for(var i=0; i < amount; i++)
  {
    var temp = [];
    this.layerObjects.push(temp);
  }

}
spawnToCollide(spawnXPos,spawnYPos,sizeToSpawn,objects)  //checks to see if new object will collide with existing objects in a given canvas layer
{
  var obj1;                                              
  var willCollide = false;
        
  for(var i=0; i < objects.length;i++)
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

spawner(objects)                                 //dynamically spawns objects using various random parameters within set ranges.
{                                                         //input parameter is an array of objects in a given layer, to which the spawned
  var randomX = Math.floor(Math.random() * 1024);         //object is added
  var randomY = Math.floor((Math.random() * 768)-10);
  var ranSize = Math.floor(Math.random() * 90) + 10;

  if(!this.spawnToCollide(randomX, randomY, ranSize, objects))
  {
    var randomZ;
    var ranXVel = Math.floor(Math.random() * 300)-150;
    var ranYVel = Math.floor(Math.random() * 200)-110;
    var ranZVel = Math.random() * 5;
    var ranDensity = Math.floor(Math.random() * 50) + 1;

    if(objects==this.layerObjects[this.numCanvases - 1])             //assigns a Z position based on the context of the objects in the input parameter array
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
    objects.push(spawn);                                  //create new gameplay object and place into in the array for that canvas based on z-position

  }
}

spawnerLoop()                                 //randomly chooses an array of objects from the "bottom" 6 game layers
{                                                      //and passes it into the spawner function
  var ranCanvas = Math.floor(Math.random() * 5);       //TODO rename function. This is not a loop.
  this.spawner(this.layerObjects[ranCanvas]);

}

cleanUpOffScreen(objects)                     //checks if objects have strayed too far off screen and removes them
{                                                      //from the appropriate object array, eliminating update of the given
  for(var i=0; i < objects.length; i++)                    //object and allowing it to be garbage collected
  {
    var obj = objects[i];                              //objects completely off screen left, right and bottom.
    if((obj.xPos-obj.scale)>1024||       //top allows some leeway for objects to leave play area
       (obj.xPos+obj.scale)<0||                        //and then return
       (obj.yPos-obj.scale)>768||
       (obj.yPos+obj.scale*10)<0)
    {
      if((obj.yPos-obj.scale)>768 && objects==this.layerObjects[this.numCanvases-1])
      {
        this.patientHealth -= obj.scale;                    //effects patient health score and resets multiplier
        this.multiplier = 1;                        //if object removed from past bottom of screen. (i.e. pathogen
      }                                               //will effect patient) need to adjust this for multiplayer
      objects.splice(i,1);                             //possibly continue use for combined multiplier
    }                                                  //and give each player their own multiplier in addition
  }
}

cleanUpWeapons()                              //removes player generated projectiles when too far off screen                       
{                                                      //so they no longer update and can be garbage collected
  for(var i=1; i < this.playerObjects.length; i++)              //Allows leeway so projectiles can strike partially off screen
  {                                                    //objects. rename to cleanUpProjectiles    
    var obj = this.playerObjects[i];
    if((obj.xPos-100)>1024||
       (obj.xPos+100)<0||
       (obj.yPos-100)>768||
       (obj.yPos+100)<0)
    {
      this.playerObjects.splice(i,1);
      this.multiplier = 1;
    }
  }
}

cleanUpLoop()                                 //sends each canvas layer object array into the clean up function
{
  this.cleanUpWeapons();

  for(var i=0;i<this.layerObjects.length;i++)
  { 
    this.cleanUpOffScreen(this.layerObjects[i]);
  } 
}

handleInput()                                           //KEEP ON SERVER SIDE IN CONTROLLER HANDLER, LOOP THROUGH EACH PLAYER
{
  if(!this.pressedKeys || this.pressedKeys == null)
  { 
    this.pressedKeys = {"a":false,"d":false,"s":false, "w":false, "m":false}; 
  }
  if(this.pressedKeys["a"]&&this.pressedKeys["d"]&&this.pressedKeys["w"])         //forward no rotation when a,d,w pressed
  {
    this.player.changeVel(0.01*this.player.FirePointX,0.01*this.player.FirePointY);    
  }
  else if(this.pressedKeys["a"]&&this.pressedKeys["w"])                      //forward and rotate left when a,w pressed
  {
    this.player.changeAngle(-0.05);
    this.player.changeVel(0.01*this.player.FirePointX,0.01*this.player.FirePointY); 
  }                                 
  else if(this.pressedKeys["d"]&&this.pressedKeys["w"])                      //forward and rotate right when d,w, pressed
  {
    this.player.changeAngle(0.05);
    this.player.changeVel(0.01*this.player.FirePointX,0.01*this.player.FirePointY);
  }
  else if(this.pressedKeys["a"]&&this.pressedKeys["s"])                     //backward and rotate left when a,s, pressed
  {
    this.player.changeAngle(-0.02);
    this.player.changeVel(-0.001*this.player.FirePointX,-0.001*this.player.FirePointY);
  }                                                       
  else if(this.pressedKeys["d"]&&this.pressedKeys["s"])                     //backward and rotate right when d,s, pressed
  {
    this.player.changeAngle(0.02);
    this.player.changeVel(0.001*this.player.FirePointX,0.001*this.player.FirePointY); 
  }                                                       
  else if(this.pressedKeys["a"])                                       //rotate left when a only pressed
  {
    this.player.changeAngle(-0.1);
  }
  else if(this.pressedKeys["d"])                                       //rotate right when d only pressed
  {
    this.player.changeAngle(0.1);
  }
  else if(this.pressedKeys["s"])                                       //backward when s only pressed
  {
    this.player.changeVel(-0.001*this.player.FirePointX,-0.001*this.player.FirePointY)               
  }
  else if(this.pressedKeys["w"])                                       //forward when w only pressed
  {
    this.player.changeVel(0.01*this.player.FirePointX,0.01*this.player.FirePointY);             
  }
  if(this.pressedKeys["m"]){ this.fire(); }
}
updateLoop(delta, zMultiplier)                             //input parameter is amount of time which has passed during a given frame
{                                                      //which is then passed into the update function of each object in the game
  for(var i=0; i < this.playerObjects.length; i++)          
  {
    this.playerObjects[i].update(delta);                    //updates player and all player generated projectiles
  }  

  for(var i=0; i < this.layerObjects.length; i++)          //updates each object in a given canvas layer one at a time, one canvas at
  {                                                    //time until all non-player objects are updated
    var group = this.layerObjects[i];
    for(var j=0; j < group.length; j++)
    {
      group[j].update(delta, zMultiplier);
    }  
  }
}

moveInZ(objects)                                  //moves objects between the various canvas layer object arrays based on their Z position value
{                                                          //provides the illusion of movement in the 3rd spatial direction.
  for(var i = 0; i < objects.length; i++)                  //input parameter is an array of objects rendering in a given canvas layer
  {                                                        //TODO bool or early check so n-squared algorithm isnt necessary for objects that wont be moving
    for(var j = 0; j < this.layerObjects.length; j++)
    {
      if(objects[i].zPos < (j+1)*(80/this.numCanvases) && (j+1)*(80/this.numCanvases) < 80)  //the z position zone of the numCanvases-1 bottom layers
      {
        this.layerObjects[j].push(objects[i]);                 //adds object to the object array for that layer
        objects.splice(i,1);                               //removes object from previous layer
        j = this.layerObjects.length;                          //exits loop
      }
      else if(objects[i].zPos >= (80 - (80/this.numCanvases)))  //special case for state for top layer where player objects reside
      {
        if(objects[i].yPos < 600)                          //keeps objects from pushing into the top layer at the bottom of the screen
        {
          this.layerObjects[this.numCanvases-1].push(objects[i]);
          objects.splice(i,1);
          j = this.layerObjects.length;
        }
      }
    }
  }              
}

moveInZLoop()                                     //sends all of the canvas layer object arrays into the moveInZ function to be checked
{
  for(var i=0; i < this.layerObjects.length;i++)
  {
    this.moveInZ(this.layerObjects[i]);
  }
}

detectCollision(objects)                          //detects collision between all collidable objects in a given canvas layer object array
{                                                          //input parameter is a canvas layer object array
                                                                                                         
  for(var i=0; i < objects.length;i++)                         //resets each object's variable that indicates if the object is colliding with something else during a given frame
  {
    objects[i].isColliding = false;
  }

  for(var i=0; i < objects.length;i++)                         //compares each object with every other object in the canvas layer object array
  {

    for(var j=i+1; j < objects.length;j++)
    {
      if((Math.abs(objects[i].xPos-objects[j].xPos)) <= (objects[i].scale + objects[j].scale))
      {                                                    //quick check to see if objects are near each other in X before doing more computationally heavy
        this.collisionReaction(objects,i,j);                    //checks for collision
      }                                                    //TODO double this up to check for Y
    }
  }
}

playerCollision(objects)                          //detects collision between player and player projectiles with top layer objects
{
  var obj1;
  var obj2;
                                            
  for(var i=0; i < this.playerObjects.length;i++)                   //resets each player object's variable that indicates if the object is colliding with something
  {                                                        //else during a given frame
    this.playerObjects[i].isColliding = false;
  }
                                                   
  for(var i=0; i < objects.length;i++)                         //same for all non-player objects
  {
    objects[i].isColliding = false;
  }

  for(var i=0; i < this.playerObjects.length; i++)
  {
    obj1 = this.playerObjects[i];
    for(var j=0; j < objects.length;j++)                               //compares each object with player and/or player projectiles
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
          if(!this.endGame()){this.playerScore += Math.ceil(1000/obj2.scale) * this.multiplier;}                       //TODO NEED TO ADJUST THIS TO CURRENT "view" SETUP
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
          if(i>0)
          {
            this.multiplier++;                                                                                   //TODO NEED TO ADJUST THIS TO CURRENT "view" SETUP
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
          else{this.multiplier = 1;}                                                                         //TODO NEED TO ADJUST THIS TO CURRENT "view" SETUP        
          if(obj2.scale<10){objects.splice(j,1);}
        }
      }
    }
  }
}
collisionReaction(objs,i,j) //TODO update comments
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
          var spawn = new Game.Entity(midPoint.x, midPoint.y, (obj1.zPos + obj2.zPos)/2, obj3Vel.x, obj3Vel.y, (obj1.zVel + obj2.zVel)/2, Math.ceil((obj1.scale + obj2.scale)/Math.sqrt(2)),
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
            this.collisionPhys(deltaX, deltaY, sqDistance, obj1, obj2); 
          }
          else if(overlap <=0.95)                                 //large objects with more overlap will react more violently, accelerating apart 
          {                                                       //until no longer overlapping
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

collisionPhys(dX,dY,sqDist,o1,o2)                       //takes the forward momentum of the two objects and determines what their direction
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
collisionLoop()                                         //sends each canvas layer object array into the collision detection function
{
  this.playerCollision(this.layerObjects[this.numCanvases-1]);

  for(var i=0; i < this.layerObjects.length;i++)
  {
    this.detectCollision(this.layerObjects[i]);
  }
}

endGame()                                                             //checks conditions for game being over
{                                                                     //TODO adjust for multiplayer
  var gameOver;

  if(this.player.health <= 0)                                         //game over if player hull is compromised
  {
    this.player.health = 0;
    gameOver = true;
  }
  else if(this.patientHealth <= 0)                                    //game over if too many pathogens get past the player and infect the patient
  {
    this.patientHealth = 0;
    gameOver = true;
  }
  else
  { 
    gameOver = false;
  }

  return gameOver;
}

  updateViewPackage()
  {
    this.viewPackage.playerScore = this.playerScore;
    this.viewPackage.multiplier = this.multiplier;
    this.viewPackage.patientHealth = this.patientHealth;
  }
  
  viewUpdate()                                     //MOVE TO SERVER, send info to clients
  {
    if(!this.endGame())                                          //while game isnt over, update game time, score and multplier
    {
      if(this.multiplier >= 9){this.multiplier = 9;}        //cap multiplier at 9
    }
    else
    {
      this.multiplier = 1;
      this.gameOver = true;
    }
    this.updateViewPackage();  
  }
}  //updated from CSE322 to use for CSE4050

  Game.Entity = class                                                                           //anything in the game that collides
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
  
    update(seconds, zMultiplier)                                                                    //updates velocity and position of object 
    {
      if(this.xVel != 0){this.xVel*=0.999;}                                            //friction, slowing velocity in all directions over time
      if(this.yVel != 0){this.yVel*=0.999;}
      if(this.zVel != 0){this.zVel*=0.999;}	
      this.yVel += 0.1;                                                                //simulates blood flow, moving objects toward bottom screen
      this.xPos += this.xVel*seconds;                                                  //position updated by velocity during that frame
      this.yPos += this.yVel*seconds;                                                  //in each spatial direction
      this.zPos += this.zVel*seconds*zMultiplier;
    }
  };
  
  Game.Projectile = class                                                                     //emitted object which does not collide with players
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
  };
  
  Game.Player = class                                                                      //player character object. duplicated in TUT
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


var SOCKET_LIST = {};
var GAME_LIST = {};
var serverIntervalTime = 20;
var connections = 0;
var activeGames = 0;
var MAX_CONNECTIONS = 10;
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
  socket.gameCreated = false;
  socket.gameOverSent = false;
  SOCKET_LIST[socket.id] = socket;
  console.log('socket connection');
  connections++;
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
  function gameStartup()
  {
    var game = new Game;
    GAME_LIST[socket.id] = game;
    console.log("game instance running");
    socket.gameCreated = true;
    socket.emit("gameStarted");
    activeGames++;
    console.log(connections + " connections active");
    console.log(activeGames + " games active");
  }
  socket.on('disconnect', function(){
    delete SOCKET_LIST[socket.id];
    delete GAME_LIST[socket.id];
    connections--;
    activeGames--;
    console.log("disconnection");
    console.log(connections + " connections active");
    console.log(activeGames + " games active");
  });

  socket.on('playerInput', function(data){   //socket paired automatically by socket io.  update pressedKeys variable of socket's game object here
  if(GAME_LIST[socket.id]){GAME_LIST[socket.id].pressedKeys = data;}
  });

  socket.on('startGame', function(){
    if(connections <= MAX_CONNECTIONS && !socket.gameCreated)
    {  
      gameStartup();
    }
    else
    {
      socket.emit('serverFull');
    }
  });

  socket.on('restartGame', function(){
    socket.gameCreated = false;
    delete GAME_LIST[socket.id];
    activeGames--;
    socket.gameOverSent = false;
    console.log("game restart");
    gameStartup();
  });

});
    
  setInterval(function(){
    for(var i in SOCKET_LIST)
    {
      var socket = SOCKET_LIST[i];
      if(socket.gameCreated)
      {
        var game = GAME_LIST[socket.id];
        if(!game.gameOver)
        {
          game.tick++;

          if(game.tick >= 6000)
          {
            game.zDifficultyMultiplier += 0.1;
            if(game.spawnRate > 1)
            {
              game.spawnRate--;
              game.zDifficultyMultiplier += 0.1;
              console.log(game.spawnRate);
              game.tick = 0;
              game.spawnClock = 0;
            }
          }

          game.randomizer = Math.random() - 0.5;                       //creates a random number between -0.5 and 0.5 to randomize various processes
                                                              //TODO refactor into function. maybe move into cleanup loop    
          game.cleanUpLoop();                                          //removes non-player objects from their arrays for gabage collection when off screen 
  
          game.spawnClock++
                                                  //temporary spawner delay to increase difficulty
          if(game.spawnClock==game.spawnRate)                               
          {
            game.spawnerLoop();                                        //loop that creates various game objects that are not the player
            game.spawnClock = 0;                                       //nor a player missile
          }

          game.handleInput();
                                                //INPUT ON CLIENT. HANDLE INPUT EMITTED INPUT HERE
          game.updateLoop(game.intervalTime/1000, game.zDifficultyMultiplier);                          //update of all game objects
                                                              //TODO refactor collision process        
          game.collisionLoop();                                        //collision calculations among all collidable game objects that arent player or player weapons
  
          game.moveInZLoop();                                          //moves objects between canvas layers based on their z value
  
          game.viewUpdate();

          socket.emit('playerLayer', game.playerObjects);
          socket.emit('objectLayers', game.layerObjects);
          socket.emit('viewLayer', game.viewPackage);
        }
        else if(!socket.gameOverSent)
        {
          socket.emit('gameOver');
          socket.gameOverSent = true;
           //do game over stuff
        }                                                           //TRANSMIT DATA TO CLIENT
      }
    }
  },serverIntervalTime);

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



