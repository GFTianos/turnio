module.exports = function (controller) {
     
    // Show the api of @turnio
    controller.hears(

      ['help', 'help (.*)', '(.*) help (.*)'], 

      'direct_message,direct_mention,mention', 

      help

    );

    // Show users in the queue
    controller.hears(
      
      ['cola','cola (.*)','(.*) cola (.*)','queue'], 
      
      'direct_message,direct_mention, mention', 
      
      queue

    );

    // Add user to the queue
    controller.hears(
      
      ['add','add (.*)', '(.*) add (.*)', 'añademe', 'añademe (.*)'],
      
      'direct_message,direct_mention,mention', 
      
      add

    );

    // Delete user in the queue
    controller.hears(
      
      ['del', 'del (.*)', '(.*) del (.*)', 'remove (.*)', 'borrame', 'borrame (.*)'],
      
      'direct_message,direct_mention,mention', 
      
      del
      
    );

    // Delete all users in the queue
    controller.hears(
      
      ['limpia','limpia (.*)','(.*) limpia (.*)'],
      
      'direct_message,direct_mention,mention', 
      
      clean
      
    );

    /** Callbacks for hears */    

    function help(bot, message) {
       
      const help = 'Hola '+ '<@'+ message.info +'>! Esta es mi API disponible: ' +'\n' + 
            '> `add`  : Te agrega a la cola de turno para desplegar\n' +
            '> `cola` : Muestra la cola de usuarios\n' +
            '> `del`  : Te elimina de la cola\n' + 
            '> `limpia` : Limpia la cola de usuarios\n' +
            '> `help` : Muestra la api del @turnio\n'; 

       bot.reply(message, help);

    }

    function queue(bot, message) {

        // load user from storage...
        controller.storage.teams.get('queue', function(err, queue) { 
            
            if (!queue || !queue.users || queue.users.length == 0) {
                bot.reply(message, 'No hay nadie en la cola en este momento, Mencioname y añade la palabra clave `add` para añadirte. :D');                
            } else {
                var text = 'La cola se componen de las siguientes personas: \n' + generateQueueList(queue.users);
                bot.reply(message, text);
            }

        });

    }

    function add(bot, message) {

        controller.storage.teams.get('queue', function(err, queue) {
            if(err){
                return throwError(err);
            }

            if (!queue || !queue.users) {
                queue = {
                    'id': 'queue',
                    'users': []
                };                
            }
            
            var user = findUser(queue.users,message.user);
                                     
            if(user){                
                bot.reply(message, '<'+ user.name +'> ya estas dado de alta en la cola, cuando sea tu turno te avisare.');
            } else {
                
                userInfo(bot.api, message.user, function (err, user) {
                    
                    queue.users.push({
                        id: message.user,
                        name: '@' + user.name
                    });

                    controller.storage.teams.save(queue, function(err,saved) {
                        if (err) {
                            bot.reply(message, 'I experienced an error adding your task: ' + err);
                        } else {
                            bot.api.reactions.add({
                                name: 'thumbsup',
                                channel: message.channel,
                                timestamp: message.ts
                            });
                        }
                    });
                });
            }            
        });
    }
  
    function del(bot, message) {
        
        controller.storage.teams.get('queue', function(err, queue) {
            if(err){
                return throwError(err);
            }
            
            if (!queue || !queue.users || queue.users.length == 0 || findUser(queue.users,message.user) === undefined) {
                bot.reply(message, 'No se ha podido realizar la eliminacion correctamente, esto se puede dar porque no estas en la cola o bien porque esta no se ha creado\n' + 
                                    'Para ver las personas en la cola, mencioname y añade la palabra clave `cola`.');                
            } else {
                                     
                queue.users = queue.users.filter(function(user){
                    return (user.id != message.user);
                });
                     
                controller.storage.teams.save(queue, function(err,saved) {
                    if (err) {
                        bot.reply(message, 'I experienced an error adding your task: ' + err);
                    } else {
                        bot.api.reactions.add({
                            name: 'thumbsup',
                            channel: message.channel,
                            timestamp: message.ts
                        });

                        if(queue.users && queue.users.length > 0){

                            bot.reply(message, '<'+ queue.users[0].name +'> es tu turno! cuando termines eliminate de la cola mencionandome y añade la palabra clave `del`. Gracias');
                        }
                    }
                });                
            }                        
        });

    }

    function clean(bot, message) {
        
        controller.storage.teams.get('queue', function(err, queue) {
            console.log('>> Q:', queue);
            if(err){
                console.log('>> ERR:', err);
                return throwError(err);
            }
            
            if (!queue || !queue.users || queue.users.length == 0) {
                bot.reply(message, 'No hay cola en este momento por lo tanto no se puede limpiar.');                
            } else {                
                queue.users = [];                                          
                controller.storage.teams.save(queue, function(err,saved) {
                    if (err) {
                        bot.reply(message, 'I experienced an error adding your task: ' + err);
                    } else {
                        bot.api.reactions.add({
                            name: 'thumbsup',
                            channel: message.channel,
                            timestamp: message.ts
                        });
                    }
                });                
            }                        
        });

    }
    

    /** Utils */

    // (Async) get info user by id
    function userInfo(api, id, next){
        console.log('>> USER INFO');
        api.users.info({
           user: id
        }, function (err, res) {
            console.log('>> USER CB');
            console.log(err);
            console.log(res.user);
            next(err, res.user);
        });
    }

    // Generate list of users
    function generateQueueList(users) {
        
        var text = '';

        users.forEach(function(user, i){                
            text = text + '> `' +  (i + 1) + 'º` ' +  user.name + '\n';            
        });

        return text;
    }

    // Find user by id
    function findUser(users, id){
        
        return users.find(function(user, i){ return (user.id === id);});                
    }






};