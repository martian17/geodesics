


let onWidthChange = function(e,cb){
    let cancel = false;
    let w = e.width;
    cb(e.width,e.width);
    (async ()=>{
        while(!cancel){
            await Animation.nextFrame();
            if(e.width !== w){
                cb(e.width,w);
                w = e.width;
            }
        }
    })();
    return {
        cancel:function(){
            cancel = true;
        }
    };
};

let FlatCanvas = async function(){
    let ratio = 2;
    let wrapper = new ELEM("div");
    let canvas = wrapper.add("canvas").e;
    let width;
    let height;
    let that = this;
    onWidthChange(wrapper,(w)=>{//will be fired immediately first time
        width = w;
        height = w/ratio;
        canvas.width = width;
        canvas.height = height;
        that.draw();
    });
    let ctx = canvas.getContext("2d");
    
    let points = [];
    
    this.drawGrid = function(){
        //latitude
        for(let i = 0; i <= 180; i+=15){//15 degrees increment
            let r = i/180;
            ctx.beginPath();
            ctx.moveTo(r*height,0);
            ctx.lineTo(r*height,width);
            ctx.stroke();
        }
        //longitude
        for(let i = 0; i <= 360; i+=15){//15 degrees increment
            let r = i/360;
            ctx.beginPath();
            ctx.moveTo(0,r*width);
            ctx.lineTo(height,r*width);
            ctx.stroke();
        }
    };
    
    ctx.drawPoints = function(){
        for(let i = 0; i <  points.length; i++){
            let [long,lat] = points[i];//returns long and lat in radians
            ctx.beginPath();
            ctx.arc(long/(Math.PI*2)*width,(-lat+Math.PI/2)*height,width/100,0,Math.PI*2);
            ctx.fillStyle = "#8fa";
            ctx.fill();
        }
    };
    
    let toCartesian = function([long,lat]){//returns a normalized vector
        let rr = Math.cos(lat);
        let x = rr*Math.cos(long);//x is maximized at the UK
        let y = rr*Math.sin(long);//y is maximized at bangladesh
        let z = Math.sin(lat);//z goes positive to the north pole
        return [x,y,z];
    };
    let toPolar = function([x,y,z]){
        let long = Math.atan2(y,x);
        let lat = Math.atan2(z,rad(x,y));
    };
    
    let argxyz = function(){
        let sin;
        let cos;
        if(arguments.length === 2){
            cos = arguments[0];
            sin = arguments[1];
        }else{
            let ang = arguments[0];
            cos = Math.cos(ang);
            sin = Math.sin(ang);
        }
        return [cos,sin];
    };
    
    let rx = function(){
        let [cos,sin] = argxyz(arguments);
        return [
            1,0,0,
            0,cos,-sin,
            0,sin,cos
        ];
    };
    let ry = function(){
        let [cos,sin] = argxyz(arguments);
        return [
            cos,0,sin,
            0,1,0,
            -sin,0,cos
        ];
    };
    let rz = function(){
        let [cos,sin] = argxyz(arguments);
        return [
            cos,-sin,0,
            sin,cos,0,
            0,0,1
        ];
    };
    let rad = function(){
        let sum = 0;
        for(let i = 0; i < arguments.length; i++){
            sum += arguments[i]*arguments[i];
        }
        return Math.sqrt(sum);
    };
    
    
    //matrix operations
    //only work with square matrix, and optimized for width == 3
    let matmul = function(m1,m2){
        let w = 3;
        if(m1.length !== w*w){
            w = Math.sqrt(m1.length);
        }
        let result = [];
        for(let i = 0; i < w; i++){
            for(let j = 0; j < w; j++){
                let idx = i*w+j;
                let r = 0;
                for(let k = 0; k < w; k++){
                    r += m1[i*w+k]*m2[k*w+j];
                }
                result[idx] = r;
            }
        }
        return result;
    };
    let transform = function(mat,vec){
        let w = vec.length;
        let result = [];
        for(let i = 0; i < w; i++){
            let r = 0;
            for(let j = 0; j < w; j++){
                r += mat[i*w+j]*vec[j];
            }
            result[i] = r;
        }
        return result;
    };
    let inverse = function(mat){
        let w = 3;
        if(mat.length !== w*w){
            w = Math.sqrt(mat.length);
        }
        
    };
    
    this.gd = [];
    
    this.getGeodesics = function(){
        let [lat1,long1] = toPolar(points[0]);
        let p2 = points[1];
        //let p1 = toCartesian(points[0]);
        //let p2 = toCartesian(points[1]);
        //plane consists of p1 p2 and 0,0,0
        //find the transformation matrix for p1 and p2 so that they both lie on equator
        //x y z 
        //rotate -long1 on the z axis
        let R1 = matmul(rz(-long1),ry(-lat1));
        let [x2d,y2d,z2d] = transform(R1,p2);
        let r2 = rad(y2d,z2d);
        let R2 = rx(y2d/r2,-z2d/r2);
        let R = matmul(r1,r2);
        let invR = inverse(R);//use this matrix to map the arc on xy plane to the surface of sphere
        
        //now p1 = x+, p2 ∈ plane(xy)
        let [x2dd,y2dd,z2dd] = transform(R,p2);
        console.log(z2dd);//should be close to 0
        let angularDistance = Math.atan2(y2dd,x2dd);
        let points = [];
        for(let i = 0; i < angularDistance; i+=Math.PI/180){//one degree increment
            points[i] = transform(invR,[Math.cos(i),Math.sin(i),0]);
        }
        this.gd = points;
        return points;
    };
    
    this.draw = function(){
        ctx.clearRect(0,0,width,height);
        this.drawGrid();
        //only deal with geodesics iff there are two points
        if(points.length === 0){
            return false;
        }else if(points.length === 1){
            //draw a single point
            this.drawPoints();
            return false;
        }
        //calculate the geodesics
        let gd = this.getGeodesics();
        //draw the geodesics
        ctx.beginPath();
        for(let i = 0; i < gd.length; i++){
            let [long,lat] = gd[i];//returns long and lat in radians
            ctx.lineTo(long/(Math.PI*2)*width,(-lat+Math.PI/2)*height);
        }
        //lastly, draw the points
        this.drawPoints();
    }
    
    while(true){
        await Animation.nextFrame();
        
    }
    
    this.e = canvas;
    
}



let main = async function(){
    let body = new ELEM(document.body);
    let wrapper = body.add("div","class:wrapper");
    let left = wrapper.add("div");
    let right = wrapper.add("div");
    
    let flatCanvas = new FaltCanvas();
    left.add(flatCanvas.e);
    
    let globeCanvas = new GlobeCanvas();
    right.add(globeCanvas.e);
    
    
    //let flatCanvas = new FlatCanvas();
    
}

main();

