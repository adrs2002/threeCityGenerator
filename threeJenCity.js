"use strict";

// import THREE from 'three'

/**
 * @author Jey-en  https://github.com/adrs2002
 * 
 * this repo -> https://github.com/adrs2002/Three.jenCity
 *
 */

/**
 * @constructor
 * @extends THREE.Object3D
 */
class jenCity extends THREE.Object3D {
    // コンストラクタ
    constructor(_option = {}) {
        super();

        const {
            isTextured = true,
            size = new THREE.Vector3(0.2, 1.0, 0.2)
        } = _option;

        this.clock = new THREE.Clock();

        this.geo = new THREE.InstancedBufferGeometry();
        



        this.geo.copy(new THREE.BoxBufferGeometry(5, 5, 5));

        this.oneSize = 128;
        this.particleCount = this.oneSize * this.oneSize;

        //入れ物を初期化していく
        //シェーダに渡すには明確に【型】が決まってる必要があるため、こういうことを行う
        // this.translateArray = new Float32Array(this.particleCount * 16);
        this.uvEArray = new Float32Array(this.particleCount * 2);

        this.translateArray = new Float32Array(this.particleCount * 3);
        this.colArray = new Float32Array(this.particleCount * 3);
        this.scaleArray = new Float32Array(this.particleCount * 3);
        this.timeArray = new Float32Array(this.particleCount * 1);


        //↓こいつらはシェーダーにはいかない

        //generate Noize
        const noiseSize = 256;
        this.noiseTexture = new THREE.DataTexture(this.createNoizeTexture(4, 10, 0.65, noiseSize), noiseSize, noiseSize, THREE.RGBAFormat);
        this.noiseTexture.wrapS = THREE.MirroredRepeatWrapping;
        this.noiseTexture.wrapT = THREE.MirroredRepeatWrapping;
        this.noiseTexture.repeat.set(2, 2);
        this.noiseTexture.needsUpdate = true;

        this.dummyTexture = new THREE.DataTexture(this.createWhiteTexture(2), noiseSize, noiseSize, THREE.RGBAFormat);
        this.dummyTexture.wrapS = THREE.MirroredRepeatWrapping;
        this.dummyTexture.wrapT = THREE.MirroredRepeatWrapping;
        this.dummyTexture.repeat.set(1, 1);
        this.dummyTexture.needsUpdate = true;

        for (let i = 0; i < this.oneSize; i++) {
            for (let m = 0; m < this.oneSize; m++) {

                this.translateArray[m * this.oneSize * 3 + i * 3 + 0] = i * 10;
                this.translateArray[m * this.oneSize * 3 + i * 3 + 1] = 0;
                this.translateArray[m * this.oneSize * 3 + i * 3 + 2] = m * 10;

                this.scaleArray[m * this.oneSize * 3 + i * 3 + 0] = 1;
                this.scaleArray[m * this.oneSize * 3 + i * 3 + 1] = Math.random() * 2 + 5;
                this.scaleArray[m * this.oneSize * 3 + i * 3 + 2] = 1;

                this.colArray[m * this.oneSize * 3 + i * 3 + 0] = 1.0;
                this.colArray[m * this.oneSize * 3 + i * 3 + 1] = 1.0;
                this.colArray[m * this.oneSize * 3 + i * 3 + 2] = 1.0;
                /*
                const mx = new THREE.Matrix4();
                // position, quaternion, scale
                mx.compose(new THREE.Vector3(i, 0, m), new THREE.Quaternion(), new THREE.Vector3(1, Math.random() * 10, 1));
                for(let x =0; x < 16;x++){
                    this.translateArray[m * this.oneSize * 16 + i * 16 + x] = mx.elements[x];
                }
                */
                this.uvEArray[m * this.oneSize * 2 + i * 2 + 0] = 0;
                this.uvEArray[m * this.oneSize * 2 + i * 2 + 1] = 0;
            }
        }


        this.material = new THREE.RawShaderMaterial({
            uniforms: {
                map: { value: isTextured ? this.noiseTexture : this.dummyTexture }
            },
            vertexShader: this.getVshader(),
            fragmentShader: this.getFshader(),
            depthTest: true,
            depthWrite: true,
            transparent: false,
            // side: THREE.DoubleSide,
            // depthFunc: THREE.NeverDepth,
            blending: THREE.NormalBlending
        });

        this.geo.addAttribute("translate", new THREE.InstancedBufferAttribute(this.translateArray, 3, 1));
        this.geo.addAttribute("scale", new THREE.InstancedBufferAttribute(this.scaleArray, 3, 1));
        // this.geo.addAttribute("col", new THREE.InstancedBufferAttribute(this.colArray, 3, 1));
        this.geo.addAttribute("uve", new THREE.InstancedBufferAttribute(this.uvEArray, 2, 1));

        const mesh = new THREE.Mesh(this.geo, this.material);
        mesh.frustumCulled = false;
        mesh.scale.copy(size);
        this.add(mesh);

        // this.updateMatrixWorld = this.updater;

        return this;
    }

    //////////////////////////

    createWhiteTexture(width = 2) {
        const data = new Uint8Array(4 * width * width);
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < width; j++) {
                for (let m = 0; m < 4; m++) {
                    data[i * width * 4 + j * 4 + m] = 255;
                }
                data[i * width * 4 + j * 4 + 3] = 255;
            }
        }
        return data;
    }

    createNoizeTexture(oct, ofs, per, width) {
        const param = {
            octave: oct,
            offset: ofs,
            persistence: per,
            seed: 1
        };

        function setSeed(seed) {
            param.seed = seed;
        }

        function interpolate(a, b, t) {
            return a * t + b * (1.0 - t);
        }

        function rnd(x, y) {
            const a = 123456789;
            const b = a ^ (a << 11);
            const c = param.seed + x + param.seed * y;
            const d = c ^ (c >> 19) ^ (b ^ (b >> 8));
            let e = d % 0x1000000 / 0x1000000;
            e *= 10000000.0;
            return e - Math.floor(e);
        }

        function srnd(x, y) {
            const corners = (rnd(x - 1, y - 1)
                + rnd(x + 1, y - 1)
                + rnd(x - 1, y + 1)
                + rnd(x + 1, y + 1)) * 0.03125;
            const sides = (rnd(x - 1, y)
                + rnd(x + 1, y)
                + rnd(x, y - 1)
                + rnd(x, y + 1)) * 0.0625;
            const center = rnd(x, y) * 0.625;
            return corners + sides + center;
        }


        function irnd(x, y) {
            const ix = Math.floor(x);
            const iy = Math.floor(y);
            const fx = x - ix;
            const fy = y - iy;
            const a = srnd(ix, iy);
            const b = srnd(ix + 1, iy);
            const c = srnd(ix, iy + 1);
            const d = srnd(ix + 1, iy + 1);
            const e = interpolate(b, a, fx);
            const f = interpolate(d, c, fx);
            return interpolate(f, e, fy);
        }

        function noise(x, y) {
            let t = 0;
            const o = param.octave + param.offset;
            const w = Math.pow(2, o);
            for (let i = param.offset; i < o; i++) {
                const f = Math.pow(2, i);
                const p = Math.pow(param.persistence, i - param.offset + 1);
                const b = w / f;
                t += irnd(x / b, y / b) * p;
            }
            return t;
        }

        function snoise(x, y, w) {
            const u = x / w;
            const v = y / w;
            return noise(x, y) * u * v
                + noise(x, y + w) * u * (1.0 - v)
                + noise(x + w, y) * (1.0 - u) * v
                + noise(x + w, y + w) * (1.0 - u) * (1.0 - v);
        }

        // create noize texture
        setSeed(new Date().getTime());
        const noiseColor = new Array(width * width);
        const data = new Uint8Array(4 * width * width);
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < width; j++) {
                noiseColor[i * width + j] = snoise(i, j, width);
                noiseColor[i * width + j] *= noiseColor[i * width + j];
                noiseColor[i * width + j] *= 255;
                for (let m = 0; m < 3; m++) {
                    data[i * width * 4 + j * 4 + m] = noiseColor[i * width + j];
                }
                data[i * width * 4 + j * 4 + 3] = 255;
            }
        }
        return data;
    }

    //////////////////////

    getVshader() {
        return `

        precision highp float;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;

        attribute vec3 position;
        attribute vec2 uv;

        attribute vec3 translate;
        attribute vec3 scale;

        attribute vec2  uve;

        varying vec2 vUv;
        varying vec2 vUv2;
        varying vec3 vCol;

        void main() {
          
            vec4 mvPosition = vec4( translate, 1.0 );
            vec3 vertexPos = position * scale;  
            vec4 mvVector = vec4(mvPosition.xyz + vertexPos, 1.0);
            mvVector.y = max(mvVector.y, 0.0);
            gl_Position =  projectionMatrix * modelViewMatrix * mvVector; 
            vUv = uv * 0.5 + uve;
            vUv2 = uv;
        }

        `;
    }

    getFshader() {
        return `
        precision highp float;
        uniform sampler2D map;
        uniform vec3 colors[3]; 

        varying vec2 vUv;
        varying vec2 vUv2;

        void main() {
            
            vec4 texColor = texture2D( map, vUv );       // ←元
            
            gl_FragColor = texColor;
            
        }
        
        `;
    }

}

