//this script largely intact from single player client-based version created for CSE322
var playArea = {

makeCanvasTags : function(amount)                          //create string containing all HTML canvas tags for placement in parent div tag
{
  var temp = '';                                           //first canvas tag is a plain red background and no game objects are drawn onto it  
  temp += '<canvas id="canvas0" width="1024" height="768" style="border:1px solid lightgrey; background-color:red; position:absolute; left:0px; top:0px; z-index:1;"></canvas>';

  for(var i=0; i < amount; i++)                            //loop to create various layers that the game objects are drawn onto 
  {                                                        //all backgrounds are transparent to create illusion that player is viewing down into the background layer
    temp += '<canvas id="' + 'canvas' + (i+1).toString() + '" width="1024" height="768" style="border:1px solid lightgrey; background-color:transparent; position:absolute; left:0px; top:0px; z-index:' + (i+2).toString() + ';"></canvas>"';
  }
  temp += '<canvas id="weapons" width="1024" height="768" style="background-color:transparent; position:absolute; left:0px; top:0px; z-index:' + (amount+2).toString() +';"></canvas>"';
  temp += '<canvas id="player" width="1024" height="768" style="background-color:transparent; position:absolute; left:0px; top:0px; z-index:' + (amount+3).toString() +';"></canvas>"';
  temp += '<canvas id="player2" width="1024" height="768" style="background-color:transparent; position:absolute; left:0px; top:0px; z-index:' + (amount+4).toString() +';"></canvas>"';
  temp += '<canvas id="UI" width="1024" height="768" style="background-color:transparent; position:absolute; left:0px; top:0px; z-index:' + (amount+5).toString() +';"></canvas>"';

  document.getElementById("parent").innerHTML = temp;      //last 4 canvases are for player emitted projectiles, player1 character object, player2 character object, and user interface respectively
}                                                          //TODO rename weapons canvas to projectiles for sake of continuity
,      
makeCanvases : function(amount)                            //fills the array that will hold the canvas documents with temp variables
{                                                          //TODO refactor amount parameter on these functions into something more meaningful
  for(var i=0; i < amount; i++)
  {
    var temp;
    canvasBag[i] = temp;
  }
}
,
makeContexts : function(amount)                            //fills the array, that will hold the canvas contexts, with temp variables
{
  for(var i=0; i < amount; i++)
  {
    var temp;
    contextBag[i] = temp;
  }
}
,
linkContexts : function(amount)                            //places canvas documents into the canvasBag array
{                                                          //so they can be accessed later, gets contexts from
  for(var i=0; i < amount; i++)                            //the canvas documents, and places them into the
  {                                                        //contextBag array so they can be accessed later 
    var temp = "canvas" + (i+1).toString();
    canvasBag[i] = document.getElementById(temp);
    contextBag[i] = canvasBag[i].getContext('2d');
  }
}
,
clearCanvases : function()                                 //clears last frame's information from each canvas context 
{
  for(i=0; i < contextBag.length; i++)
  {
    contextBag[i].clearRect(0,0,canvasBag[i].width,canvasBag[i].height);
  }
  playArea.weaponsContext.clearRect(0,0,playArea.weaponsCanvas.width,playArea.weaponsCanvas.height);
  playArea.playerContext.clearRect(0,0,playArea.playerCanvas.width,playArea.playerCanvas.height);
  playArea.player2Context.clearRect(0,0,playArea.player2Canvas.width,playArea.player2Canvas.height);
  view.uiContext.clearRect(0,0,view.uiCanvas.width,view.uiCanvas.height);
}
,
makePlayerLayer : function()
{
  playArea.playerCanvas = document.getElementById("player");            //creates player canvas, context          
  playArea.playerContext = playArea.playerCanvas.getContext('2d');
}
,
makePlayer2Layer : function()
{
  playArea.player2Canvas = document.getElementById("player2");          //creates player 2 canvas, context          
  playArea.player2Context = playArea.player2Canvas.getContext('2d');
}
,
makeWeaponsLayer : function()
{
  playArea.weaponsCanvas = document.getElementById("weapons");          //creates weapons canvas, context
  playArea.weaponsContext = playArea.weaponsCanvas.getContext('2d');
}
};                                                        
//updated from CSE322 to use for CSE4050
