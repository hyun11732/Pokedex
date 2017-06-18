// Hyun Suk Lee
// 05/12/2017
// CSE 154
// Instructor : Chadi Moussi
// assignment#6
// This javascript is connected to pokedex.html and manipulates its page.
// This script plays a pokemon game through pokedex. It starts from three
// starting pokemon and a player can choose among three to battle and catch
// other pokemon. If a player wins in a battle, a player can catch its pokemon.

(function() {
    
    "use strict";
    
    var foundPokemon;
    var mypokemon;
    var guid;
    var pid;
    
    // This function takes "id" as a parameter and return html element from html file.
    function $(id) {
        return document.getElementById(id);
    }
    
    function qsClass(name) {
        return document.querySelectorAll("." + name);
    }
        
    // This function will create the first window when the site is just loaded with three
    // starting pokemon.
    window.onload = function() {
        foundPokemon = ["Bulbasaur", "Charmander", "Squirtle"];
        var imgName = new AjaxGetPromise("https://webster.cs.washington.edu/pokedex/pokedex.php?pokedex=all");
        imgName
            .then(startPokemon);
    };
    
    // This function takes "response" as a parameter and generate 151 pokemons image icons on 
    // pokedex-view based on "response" text lists If a pokemon is not catched, this
    // pokemon icon will be black image and not clickable. If not, it will be
    // colorful and clickable. 
    function startPokemon(response) {
        response = response.split("\n");
        var previous;
        for(var i = 0; i < response.length; i++) {
            var split = response[i].split(":");
            var id = split[0];
            var src = split[1];
            if(foundPokemon.includes(id)) {
                $("pokedex-view").innerHTML += "<img class=\"sprite\" id=\"" + id + 
                        "\" src=\"sprites/" + src + "\"/>";
            } else {
                $("pokedex-view").innerHTML += "<img class=\"sprite unfound\" id=\"" +
                        id + "\" src=\"sprites/" + src + "\"/>";
            }
        }
        baseStage();
    }
    
    // This function makes catched pokemon clickable.
    function baseStage() {
        for(var i = 0; i < foundPokemon.length; i++) {
            $(foundPokemon[i]).addEventListener("click", getInfo);
        }
    }
    
    // This function brings information about clicked pokemon.
    function getInfo() {
        mypokemon = this.id;
        var getPokeCard = new AjaxGetPromise("https://webster.cs.washington.edu/pokedex/pokedex.php?pokemon=" + mypokemon);
        getPokeCard
           .then(JSON.parse)
           .then(observe);
    }
    
    // This function takes "response" as a parameter and enables "choose this pokemon"
    // button which leads to battle. Also, fill out pokemon card informations about
    // chosed pokemon.
    function observe(response) {
        pokeCard(response, 0);
        $("start-btn").setAttribute("class", "");
        $("start-btn").addEventListener("click", battlePhase);
    }
    
    // Thif function takes "info" and "player" as parameters and fill out pokemon
    // information on a pokecard based on "info", a list of information about a pokemon.
    // Also it "player" distinguishes this pokecard is a player's or an opponent's.
    function pokeCard(info, player) {
        qsClass("name")[player].innerHTML = info.name;
        qsClass("hp")[player].innerHTML = info.hp;
        qsClass("pokepic")[player].src = info.images.photo;
        qsClass("type")[player].src = info.images.typeIcon;
        qsClass("weakness")[player].src = info.images.weaknessIcon;
        qsClass("info")[player].innerHTML = info.info.description;
        var movement = info.moves;
        var move = document.getElementsByClassName("move");
        var dp = document.getElementsByClassName("dp");
        var type = document.querySelectorAll("button > img");
        var button = document.querySelectorAll(".moves > button");
        for(var i = 0 + player * 4; i < 4 + player * 4; i++) {
            button[i].setAttribute("class", "");
            if(i - (player * 4) > movement.length - 1) {
                button[i].setAttribute("class", "hidden");
            } else  {
                move[i].innerHTML = movement[i - (player * 4)].name;
                button[i].setAttribute("id", movement[i - (player * 4)].name);
                type[i].src = "icons/" + movement[i - (player * 4)].type + ".jpg";
                if(movement[i - player * 4].hasOwnProperty("dp")) {
                    dp[i].innerHTML = movement[i - (player * 4)].dp + "DP";
                } else {
                    dp[i].innerHTML = "";
                }
            }
        }
    }
    
    // This function brings information which needs for a battle like what 
    // an opponent pokemon is and their status and movement. 
    function battlePhase() {
        var request = {"startgame" : "true", "mypokemon" : mypokemon};
        var startGame = new AjaxPostPromise("https://webster.cs.washington.edu/pokedex/game.php", request);
        startGame
            .then(JSON.parse)
            .then(setUpBattle);
    }
    
    // This function takes "response" as a parameter which is setting information
    // which will be used in a battle. Also, it sets up background images which
    // is suitable for battle like bringing an opponent pokemon card and create
    // HP bar. It enables movement button so a player can attack an opponent 
    // pokemon. Also, it enables flee button so a player can ends from a battle
    // immediately. 
    function setUpBattle(response) {
        $("their-card").setAttribute("class", "");
        $("pokedex-view").setAttribute("class", "hidden");
        $("results-container").setAttribute("class" , "");
        document.querySelector(".buffs").setAttribute("class", "buffs");
        document.querySelector(".hp-info").setAttribute("class", "hp-info");
        $("start-btn").setAttribute("class", "hidden");
        $("flee-btn").setAttribute("class", "");
        health(response);
        guid = response.guid;
        pid = response.pid;     
        pokeCard(response.p2, 1);
        $("title").innerHTML = "Pokemon Battle Mode";
        for(var i = 0; i < 4; i++) {
            var myButton = document.querySelectorAll("button")[i];
            if(myButton.className != "hidden") {
                myButton.addEventListener("click", attack);
            }
        }
        $("flee-btn").addEventListener("click", fleeReady);
    }
    
    // This function takes an information which needs for flee movement. 
    function fleeReady() {
        var send = {"move" : "flee", "guid" : guid, "pid"  :pid};
        $("loading").setAttribute("class", "");
        var callflee = new Ajax7Promise("https://webster.cs.washington.edu/pokedex/game.php", send);
        callflee
            .then(JSON.parse)
            .then(fight);
    }
    
    // This function takes a pokemon's movement which a player chose. This will be sent to 
    // a server and will get information what will happen next like HP change, buff change,
    // and what an opponent pokemon movement was. Information will be used for this term
    // fighting.
    function attack() {
        var move = this.id;
        move = move.toLowerCase();
        move = move.replace(" ", "");
        var send = {"guid" : guid, "pid" : pid, "movename" : move};
        $("loading").setAttribute("class", "");
        var callFight = new AjaxPostPromise("https://webster.cs.washington.edu/pokedex/game.php", send);
        callFight
            .then(JSON.parse)
            .then(fight);
    }
    
    // This function takes "response" as a parameter. This "response" is information
    // what happened this term fight after an movement. This creates messeage to a player
    // like what pokemons movements were, calculate and show HP, buffs and debuffs
    // of pokemons. When one of pokemon's HP becomes 0, a battle will be ended.
    function fight(response) {
        $("loading").setAttribute("class", "hidden");
        messageBoard(response);
        health(response);
        buff(0, response.p1);
        buff(1, response.p2);
        if(response.p1["current-hp"] == 0) {
            endBattle(1, response);
        } else if(response.p2["current-hp"] == 0) {
            endBattle(0, response);
        }
    }
    
    // This function takes "winner", "response" as parameters and generates a result
    // of a battle. By checking "winner" paramter, it shows a player lost or not 
    // on the message board and enables "back to pokedex" button. "response" is
    // a battle information. If a player won,  a player will get an opponent pokemon 
    // in his pokedex. Also, this function disables a player's pokemon movements since
    // game is ended.  
    function endBattle(winner, response) {
        if(winner == 0) {
            $("title").innerHTML = "You won!";
            $(response.p2.name).setAttribute("class", "sprite");
            $(response.p2.name).addEventListener("click", observe);
            foundPokemon.push(response.p2.name);
        } else {
            $("title").innerHTML = "You lost!";
        }
        $("endgame").setAttribute("class", "");
        for(var i = 0; i < 4; i++) {
            var myButton = document.querySelectorAll("button")[i];
            if(myButton.className != "hidden") {
                myButton.removeEventListener("click", attack);
            }
        }
        $("endgame").addEventListener("click", returnPokedex);
    }
    
    // This function takes back battle mode screen to pokedex screen. 
    function returnPokedex() {
        $("pokedex-view").setAttribute("class", "");
        $("results-container").setAttribute("class", "hidden");
        $("their-card").setAttribute("class", "hidden");
        $("endgame").setAttribute("class", "hidden");
        $("start-btn").setAttribute("class", "");
        $("flee-btn").setAttribute("class", "hidden");
        document.querySelector(".hp-info").setAttribute("class", "hidden hp-info");
        document.querySelector("#my-card > .buffs").setAttribute("class", "hidden buffs");
        document.querySelector("#their-card > .buffs").innerHTML = "";
        document.querySelector("#my-card > .buffs").innerHTML = "";
        document.querySelector(".health-bar").setAttribute("class", "health-bar");
        $("title").innerHTML = "Your Pokedex";
        baseStage();
    }
    
    // This function takes "response", a fight information after an movement, and
    // generates a messages what a player pokemon and an opponent pokemon moved on the
    // screen. However, if player2 is lost or a player "fleed" a battle, it will not generate
    // what an opponent pokemon movement was.
    function messageBoard(response) {
        $("p1-turn-results").setAttribute("class", "");
        $("p2-turn-results").setAttribute("class", "");
        $("p1-turn-results").innerHTML = "Player 1 played " + response.results["p1-move"] +
                " and " + response.results["p1-result"]; 
        if(response.p2["current-hp"] != 0 && response.results["p1-move"] != "flee") {
            $("p2-turn-results").innerHTML = "Player 2 played " + response.results["p2-move"] +
                    " and " + response.results["p2-result"]; 
        } else {
            $("p2-turn-results").innerHTML =  "";
        }
    }
    
    // This calculates a health of each pokemon based on "response", a fight information
    // after an movement. Each pokemon's current health is shown in HP bar in the screen
    // and when their health becomes 20% less than original health, health bar will
    // change to red color.
    function health(response) {
        var p1HP = (response.p1["current-hp"] / response.p1.hp) * 100;
        var p2HP = (response.p2["current-hp"] / response.p2.hp) * 100;
        var health = document.getElementsByClassName("health-bar");
        health[0].style.width = p1HP + "%";
        health[1].style.width = p2HP + "%";
        if(p1HP < 20) {
            health[0].setAttribute("class", "health-bar low-health");
        } else {
            health[0].setAttribute("class", "health-bar");
        }
        if(p2HP < 20) {
            health[1].setAttribute("class", "health-bar low-health");
        } else {
            health[1].setAttribute("class", "health-bar");
        }
    }
    
    // This function takes "player" and "playerInfo" as parameters. "player" determines
    // it is a player's pokemon or an opponent pokemon and "playerInfo" is a fight information
    // of a player's or an opponent. It generates buff status on the screen.
    function buff(player, playerInfo) {
        var buff = playerInfo.buffs;
        var debuff = playerInfo.debuffs;
        document.querySelectorAll(".buffs")[player].innerHTML = "";
        if(buff.length != 0) {
            for(var i = 0; i < buff.length; i++) {
                var buffTag = document.createElement("div");
                document.querySelectorAll(".buffs")[player].appendChild(buffTag);
                buffTag.setAttribute("class", buff[i] + " buff");
            }
        }
        if(debuff.length != 0) {
            for(var i = 0; i < debuff.length; i++) {
                var debuffTag = document.createElement("div");
                document.querySelectorAll(".buffs")[player].appendChild(debuffTag);
                debuffTag.setAttribute("class", debuff[i] + " debuff");
            }
        }
    }
})();
