/**
 * Created by viller_m on 19/05/15.
 */
class Player {
    constructor(game, socket, groupColision) {
        this.game = game;
        this.socket = socket;
        this.groupColision = groupColision;

        this.id = socket.io.engine.id;
        this.color = this.generateColor();
        this.num = Util.randomInt(1, 50)
        this.num_mult = 0.3;
        this.mass = 20;
        this.speed_base = 5000;
        this.speed = this.speed_base / this.mass;
        this.x = this.game.world.randomX;
        this.y = this.game.world.randomY;

        this.generateSprite();
    }

    generateSprite(){
        var bmd = this.generateCircle(this.color);

        this.sprite = this.game.add.sprite(this.x, this.y, bmd);
        this.game.physics.p2.enable(this.sprite, false);

        this.setColision();

        this.sprite.id = this.id;
        this.sprite.color = this.color;
        this.sprite.num = this.num;
        this.sprite.num_mult = this.num_mult;
        this.sprite.mass = this.mass;
        this.sprite.speed_base = 5000;
        this.sprite.speed = this.sprite.speed_base / this.sprite.mass;

        this.game.camera.follow(this.sprite);
    }

    generateColor(){
        var color = ['#999999', '#CCCCCC', '#00FF00', '#0000FF', '#FF0000', '#FFFF00'];
        return color[this.game.rnd.integerInRange(0, 5)];
    }

    generateCircle(){
        var bitmapSize = this.mass * 2
        var bmd = this.game.add.bitmapData(bitmapSize, bitmapSize);
        bmd.ctx.fillStyle = this.color;
        bmd.ctx.beginPath();
        bmd.ctx.arc(this.mass, this.mass, this.mass, 0, Math.PI*2, true);
        bmd.ctx.closePath();
        bmd.ctx.fill();
        return bmd;
    }

    setColision(){
        this.sprite.body.setCircle(this.sprite.width / 2);
        this.sprite.body.fixedRotation = false;
        this.sprite.body.setCollisionGroup(this.groupColision[0]);
        this.sprite.body.collides(this.groupColision[1], this.enemyCallback, this);
        this.sprite.body.collides(this.groupColision[2], this.particulesCallback, this);
    }

    enemyCallback(body1, body2){
        if(body2.sprite.alive && ((body2.sprite.num < this.sprite.num && this.sprite.num < body2.sprite.num*100) || (this.sprite.num *1000 < body2.sprite.num))){
            this.num += Math.floor(body2.sprite.num * body2.sprite.num_mult);
            this.speed = this.sprite.speed_base / this.sprite.mass;
            this.x = this.sprite.x;
            this.y = this.sprite.y;

            this.sprite.kill();
            this.generateSprite();

            var enemy = {
                id: body2.sprite.id,
                username: body2.sprite.username,
                speed: body2.sprite.speed,
                num: body2.sprite.num,
                mass: body2.sprite.mass,
                color: body2.sprite.color,
                x: body2.sprite.x,
                y: body2.sprite.y,
                height: body2.sprite.height,
                width: body2.sprite.width,
                killed: body2.sprite.killed
            };

            body2.sprite.kill();
            this.socket.emit('kill_player', enemy);
        }
        else if(this.sprite.alive && ((this.sprite.num < body2.sprite.num && body2.sprite.num < this.sprite.num*100)||(body2.sprite.num * 1000 < this.sprite.num))){
            this.sprite.kill();
            this.socket.emit('kill_player', this.toJson());
        }
    }

    particulesCallback(body1, body2){
        if(body2.sprite.alive){
            this.mass += body2.sprite.mass;
            this.speed = this.sprite.speed_base / this.sprite.mass;
            this.x = this.sprite.x;
            this.y = this.sprite.y;

            this.sprite.kill();
            this.generateSprite();

            body2.sprite.kill();
            this.socket.emit('update_particles', body2.sprite.id);
        }
    }

    toJson () {
        return {
            id: this.sprite.id,
            username: this.sprite.username,
            speed: this.sprite.speed,
            num: this.sprite.num,
            mass: this.sprite.mass,
            color: this.sprite.color,
            x: this.sprite.x,
            y: this.sprite.y,
            height: this.sprite.height,
            width: this.sprite.width
        };
    }

    update(game){
        var cursors = game.input.keyboard.createCursorKeys()
        var dx = 0;
        var dy = 0;
        if(cursors.left.isDown) dx = dx-1;
        if(cursors.right.isDown) dx = dx+1;
        if(cursors.down.isDown) dy = dy+1;
        if(cursors.up.isDown) dy = dy-1;
        if(cursors.left.isDown || cursors.up.isDown || cursors.right.isDown || cursors.down.isDown){
            game.physics.arcade.moveToXY(this.sprite, this.sprite.x+dx, this.sprite.y+dy, this.sprite.speed);
        }
        else {
            game.physics.arcade.moveToPointer(this.sprite, this.speed);
        }

        game.debug.text('speed: ' + this.sprite.speed, 32, 120);
        game.debug.text(this.sprite.num, this.sprite.x - game.camera.x - 10, this.sprite.y - game.camera.y+ 5);
        this.socket.emit('move_player', this.toJson());
    }
}

export default Player;