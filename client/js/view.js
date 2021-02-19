var view = {

ticks : 0,                                                //tracks frames elapsed
secs : 0,
secsDisp : 0,                                                 //tracks seconds elapsed
mins : 0,                                                 //tracks minutes elapsed
playerScore : 0,                                          //player's actual score
displayedScore : 0,                                       //displayed score for score incrementation animation
multiplier : 1,                                           //score multiplier

makeUILayer : function()
{
  view.uiCanvas = document.getElementById("UI");          //canvas for displaying various user information elements
  view.uiContext = view.uiCanvas.getContext('2d');        //context for that canvas
}
,
updateUI : function()                                     
{
  view.updateTimer();
  if(view.displayedScore < view.playerScore){view.displayedScore++;}
  if(view.multiplier >= 9){view.multiplier = 9;}          //cap multiplier at 9
  view.updateUIElements();
}
,
updateTimer : function()                                  
{                                           //ticks each frame at 50fps
 /* if(view.ticks >= 50)                                    //TODO 50fps based on interval loop. change from current magic number
  {                                                       //to reference to interval time        
    view.secs++;
    view.ticks = 0;
  }
  if(view.secs >= 60)                                         
  {
    view.mins++;                                          //temp difficulty increase for each minute played on server side.
    view.secs=0;
  }*/
  view.secs = Math.floor(view.ticks/50);
  view.secsDisp = view.secs % 60;
  view.mins = Math.floor(view.secs/60);
}
,
updateUIElements : function()                             //set up time played for display and then display UI elements
{
  var secsDisplay;
  var minsDisplay;
  if(view.displayedScore < view.playerScore)
  {
    if((view.playerScore-view.displayedScore)>99){view.displayedScore+=10;}
    view.displayedScore++;
  }
  if(view.secsDisp >= 10)
  {
    secsDisplay = view.secsDisp.toString();
  }
  else
  {
    secsDisplay = "0" + view.secsDisp.toString();
  }
  if(view.mins >= 10)
  {
    minsDisplay = view.mins.toString();
  }
  else
  {
    minsDisplay = "0" + view.mins.toString();
  }
  view.displayUIElement('25px Arial','white','hull: ' + player.health.toString(),10,30);                //hull display
  view.displayUIElement('25px Arial','white','time: ' + minsDisplay + ':' + secsDisplay, 442.5, 30);    //timer display
  if(view.multiplier > 1)
  {
    view.displayUIElement('25px Arial','white','X' + view.multiplier + ' MULTIPLIER', 630, 30);         //mulitplier display
  }
  view.displayUIElement('25px Arial','white','score: ' + view.scoreDisplay(), 417.5, 60);               //score display
  view.displayUIElement('25px Arial','white','health: ' + patientHealth, 875, 30);                      //health display
}
,
displayUIElement : function(font,color,statement,xPos,yPos)                                             //function for displaying an element in the UIlayer
{
  view.uiContext.font = font;        
  view.uiContext.fillStyle = color;
  view.uiContext.fillText(statement, xPos, yPos);
}
,
scoreDisplay : function()                                 //set up score to be displayed as a 7 digit number
{                                                         //refactor to do this on start, and then when max
  var maxScoreDigits = 1000000;                           //digit changes, rather than every frame.
  var scorePwr = 0;
  var scoreDis = "";
  if(view.playerScore == 0){scoreDis = "0000000";}
  else
  {
   while(maxScoreDigits > view.displayedScore)
   {
     scorePwr++;
     maxScoreDigits = maxScoreDigits/10;
   }
   for (var i=0; i < scorePwr; i++)
   {
     scoreDis += "0";
   }
   scoreDis += view.displayedScore.toString();
  }
  
  return scoreDis;
}
,
drawPlayer : function(context, player)                                            //function for handling and drawing the various players onto their respective layers
{                                                                                 
  var playerContext = context;                                                    //TODO replace canvas drawn circles with pixel graphics
  playerContext.save();
  playerContext.translate(player.xPos, player.yPos);                              //move player canvas to new position
  playerContext.fillStyle = '#FFAA00';                                            //draw player thruster graphic 
  playerContext.beginPath();                                                      //TODO only draw when player is imparting thrust
  playerContext.arc(player.FirePointX/-2, player.FirePointY/-2, 14, 0, 2*Math.PI);
  playerContext.fill();
  playerContext.fillStyle = '#0000FF';                                            //draw player fire point graphic
  playerContext.beginPath();
  playerContext.arc(player.FirePointX, player.FirePointY, 4, 0, 2*Math.PI);
  playerContext.fill();
  playerContext.rotate(player.angle);                                             //rotate canvas to the player's rotation 
  playerContext.fillStyle = '#00FF00';                                            //draw main body of player object
  playerContext.beginPath();                                                      //canvas is translated and rotated. player object
  playerContext.arc(0, 0, player.scale, 0, 2*Math.PI);                            //is rendered normally to make the player object
  playerContext.fill();                                                           //appear to translate and rotate relative to
  if(player.isColliding)                                                          //player view
    {
        playerContext.fillStyle = '#FF0000';                                      //recolors player object on collision to indicate
        playerContext.beginPath();                                                //to the player that a collision has occurred
        playerContext.arc(0, 0, this.scale, 0, 2*Math.PI);     
        playerContext.fill();
    }
  playerContext.restore();
}
,
displayPauseScreen : function()
{
  document.getElementById("quitButton").style.display = "block";
  if(serverAccept)
  {
    document.getElementById("continueButton").style.display = "block";
  }
  console.log("display pause screen function accessed");
}
,
removePauseScreen : function()
{
  document.getElementById("continueButton").style.display = "none";
  document.getElementById("quitButton").style.display = "none";
}
};                                                  
//updated from CSE322 to use for CSE4050



