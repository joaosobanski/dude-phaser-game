import { getSocket, matchId } from "@/socketService";
import { Socket } from "socket.io-client";
import { EventBus } from "../EventBus";

class GameScene extends Phaser.Scene {
    private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private stars!: Phaser.Physics.Arcade.Group;
    private bombs!: Phaser.Physics.Arcade.Group;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys | any;
    private score = 0;
    private gameOver = false;
    private scoreText!: Phaser.GameObjects.Text;
    private socket: Socket
    private keys: {
        a: any; d: any; w: any; space: any;
    };

    constructor() {
        super('GameScene');
        this.socket = getSocket()
    }

    preload(): void { }

    create(): void {
        // A simple background for our game 

        this.add.tileSprite(0, 0, 800, 600, 'starfield').setOrigin(0).setScrollFactor(0);

        // The platforms group contains the ground and the 2 ledges we can jump on
        this.platforms = this.physics.add.staticGroup();

        // Here we create the ground.
        // Scale it to fit the width of the game (the original sprite is 400x32 in size)
        this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();

        //  Now let's create some ledges
        this.platforms.create(600, 400, 'ground');
        this.platforms.create(50, 250, 'ground');
        this.platforms.create(750, 220, 'ground');

        // The player and its settings
        this.player = this.physics.add.sprite(100, 450, 'dude');

        // Player physics properties. Give the little guy a slight bounce.
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        // Our player animations, turning, walking left and walking right.
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [{ key: 'dude', frame: 4 }],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        // Input Events
        this.cursors = this.input.keyboard?.createCursorKeys();
        this.keys = {
            a: this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            d: this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            w: this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            space: this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        };
        // Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
        this.stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 }
        });

        //@ts-ignore
        this.stars.children.iterate((child: Phaser.GameObjects.GameObject) => {
            const star = child as Phaser.Physics.Arcade.Image;
            star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });

        this.bombs = this.physics.add.group();

        // The score
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', color: '#fff' });

        // Collide the player and the stars with the platforms
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.collider(this.bombs, this.platforms);

        // Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
        this.physics.add.overlap(this.player, this.stars, this.collectStar, () => { }, this);

        this.physics.add.collider(this.player, this.bombs, this.hitBomb, () => { }, this);
    }

    update(): void {
        if (this.gameOver) {
            return;
        }

        if (this.cursors.left.isDown || this.keys.a.isDown) {
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
        } else if (this.cursors.right.isDown || this.keys.d.isDown) {
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }

        if ((this.cursors.up.isDown || this.keys.w.isDown || this.keys.space.isDown) && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }
    }

    private collectStar(player: any, star: any): void {
        star.disableBody(true, true);

        // Add and update the score
        this.score += 10;
        this.socket.emit('gain-point', matchId)
        this.scoreText.setText('Score: ' + this.score);

        if (this.stars.countActive(true) === 0) {
            // A new batch of stars to collect
            //@ts-ignore
            this.stars.children.iterate((child: Phaser.GameObjects.GameObject) => {
                const star = child as Phaser.Physics.Arcade.Image;
                star.enableBody(true, star.x, 0, true, true);
            });

            const x = (this.player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

            const bomb = this.bombs.create(x, 16, 'bomb') as Phaser.Physics.Arcade.Image;
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
            // bomb.allo = false;
        }
    }

    private hitBomb(player: any, bomb: any): void {
        this.physics.pause();

        this.socket.emit('die', matchId)
        EventBus.emit('die', matchId)

        player.setTint(0xff0000);

        player.anims.play('turn');

        this.gameOver = true;
    }
}

export default GameScene