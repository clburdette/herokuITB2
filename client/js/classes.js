var actionCodeSettings = {
  url: window.location.href,
  handleCodeInApp: true,
};

function login(){
    const addy = document.getElementById('email').value;
    firebase.auth().sendSignInLinkToEmail(addy, actionCodeSettings)
    .then(function() {
      window.localStorage.setItem('emailForSignIn', addy);
    })
    .catch(function(error) {
    document.getElementById('message').innerHTML = "something went wrong...";
    console.log(error);
    });
    document.getElementById('message').innerHTML = "link sent to email";
    document.getElementById('loginArea').style.display = "none";
    document.getElementById('signedInArea').style.display = "block";
    document.getElementById('logoutButton').addEventListener('click', logout);
}

function logout(){


  document.getElementById('loginArea').style.display = "block";
  document.getElementById('signedInArea').style.display = "none";
  document.getElementById('message').innerHTML = "Logged out";
}

document.addEventListener('DOMContentLoaded', function() {
  if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
    var email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      email = window.prompt('Please provide your email for confirmation');
    }
    firebase.auth().signInWithEmailLink(email, window.location.href)
    .then(function(result) { window.localStorage.removeItem('emailForSignIn'); })
    .catch(function(error) { console.log(error); });
    document.getElementById('loginArea').style.display = "none";
    document.getElementById('signedInArea').style.display = "none";
    document.getElementById('message').style.display = "none";
    init();
  }
  else {
    document.getElementById('message').innerHTML = "Test Complete";
    document.getElementById('sendLink').addEventListener('click', login); 
  }
});
                                                                                        //TODO fix setters and getters
class GameObject                                                                        //anything in the game that can move
{
  constructor(context, xPos, yPos, zPos, xVel, yVel, zVel)                              //defines canvas context
  {                                                                                     //position in 3 spatial axes 
    this.context = context;                                                             //and velocity in 3 spatial axes
    this.xPos = xPos;
    this.yPos = yPos; 
    this.zPos = zPos; 
    this.xVel = xVel;
    this.yVel = yVel;
    this.zVel = zVel;
  }
}


class Entity extends GameObject                                                        //anything in the game that collides
{                                                                                      //expect for the player character
 
  constructor(context, xPos, yPos, zPos, xVel, yVel, zVel, scale, density)             //extends GameObject with scale and density
  {                                                                                    //for calculating physics interactions on collision   
    super(context, xPos, yPos, zPos, xVel, yVel, zVel);
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

  constructor(context, xPos, yPos, xVel, yVel, scale, density)
  {
    this.context=context
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

class Weapon                                                                        //for future expansion.
{                                                                                   //will allow for different, swappable configurations
                                                                                    //of Projectiles  
  constructor(type)
  {
    this.context=context
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

class PowerUp                                                                      //for future expansion.
{                                                                                  //will allow for power-up items in the play area
                                                                                   //such as health or Weapon types
  constructor(type)
  {
    this.context=context
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
                  
class Player                                                                      //player character object
{

  constructor(context, xPos, yPos, xVel, yVel, scale, density, health)
  {
    this.context=context;
    this.xPos=xPos;
    this.yPos=yPos;
    this.xVel=xVel;
    this.yVel=yVel;
    this.xVec=0;                                                                 //x and y component of the object's
    this.yVec=1;                                                                 //normalized forward vector 
    this.firePointX=0;                                                           //point on the screen where the player
    this.firePointY=scale;                                                       //character's Projectiles/Weapons originate
    this.scale=scale;
    this.density=density;
    this.health=health;                                                          //health of the player object. displayed as hull.
    this.isColliding=false;
    this.angle=0;                                                                //angle of the player's forward vector in relation to true north
    this.MAX_MAG=25;                                                             //maximum velocity of player object
    this.weapons=[];                                                             //for future expansion. will hold player object's weapons objects
  }

  set Health(amount){this.health = amount;}                                      //TODO figure out what I was doing here    
  get Health(){return this.health;}
  set XVel(amount){this.xVel = amount;}
  get XVel(){return this.xVel;}
  set YVel(amount){this.yVel = amount;}
  get YVel(){return this.yVel;}
  set Angle(amount){this.angle = amount;}
  get Angle(){return this.angle;}
  get FirePointX(){return this.firePointX;} 
  get FirePointY(){return this.firePointY;}

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
  draw()                                                                        //TO DO upgrade player appearance
  {
    this.context.save();
    this.context.translate(this.xPos, this.yPos);                               //move player canvas to new position
    this.context.fillStyle = '#FFAA00';                                         //draw player thruster graphic 
    this.context.beginPath();                                                   //TODO only draw when player is imparting thrust
    this.context.arc(this.firePointX/-2, this.firePointY/-2, 14, 0, 2*Math.PI);
    this.context.fill();
    this.context.fillStyle = '#0000FF';                                         //draw player fire point graphic
    this.context.beginPath();
    this.context.arc(this.firePointX, this.firePointY, 4, 0, 2*Math.PI);
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

  update(seconds)
  {
    this.xVec = Math.sin(this.angle);                                           //calculate forward vector based on
    this.yVec = Math.cos(this.angle);                                           //player character object's rotation
    this.firePointX=this.xVec*this.scale;                                       //calculate position of fire point
    this.firePointY=this.yVec*this.scale*(-1);                                  //based on forward vector    
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
                                                                                //updated from CSE322 to use for CSE4050