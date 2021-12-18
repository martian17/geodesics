let ELEM = (()=>{
    //make the attribute parser
    let attrParser = function(str){
        //escape ":" and ";"
        let attrs = [["",""]];
        let mode = 0;
        for(let i = 0; i < str.length; i++){
            let attr = attrs.pop();
            let char = str[i];
            if(char === "_"){//escape character
                attr[mode] += str[i+1];
                i++;
                attrs.push(attr);
            }else if(char === ":"){
                mode++;
                attrs.push(attr);
            }else if(char === ";"){
                mode = 0;
                attrs.push(attr);
                attrs.push(["",""]);
            }else{
                attr[mode] += str[i];
                attrs.push(attr);
            }
        }
        attrs = attrs.filter((a)=>{
            if(a[0] === ""){
                return false;
            }
            return true;
        });
        return attrs;
    };

    let getELEM = function(nname,attrs,inner,style){
        if(typeof nname === "object" && "mtvriiutba" in nname){//it's an ELEM
            return nname;
        }else{
            return new ELEM(nname,attrs,inner,style);
        }
    };

    //will be a version 2 overhaul, so everything will be different
    let ELEM = function(nname,attrs,inner,style){
        let that = this;
        if(nname === "text"){
            this.e = document.createTextNode(inner);
            return;
        }else if(typeof nname === "string"){
            let e = document.createElement(nname);
            if(attrs){
                attrParser(attrs).map((a)=>{
                    e.setAttribute(a[0],a[1]);
                });
            }
            if(inner){
                e.innerHTML = inner;
            }
            if(style){
                e.style = style;
            }
            this.e = e;
        }else{
            this.e = nname;
        }
        this.mtvriiutba = 42;

        this.add = function(nname,attrs,inner,style){
            let elem = getELEM(nname,attrs,inner,style);
            this.e.appendChild(elem.e);
            return elem;
        };
        this.attr = function(a,b){
            this.e.setAttribute(a,b);
        };
        this.remove = function(){
            this.e.parentNode.removeChild(this.e);
        };
        this.on = function(evt){
            let cbs = [];
            for(let i = 1; i < arguments.length; i++){
                let cb = arguments[i];
                cbs.push(cb);
                this.e.addEventListener(evt,cb);
            }
            return {
                remove:function(){
                    for(let i = 0; i < cbs.length; i++){
                        that.e.removeEventListener(evt,cbs[i]);
                    }
                }
            };
        };
        //children getter/setter
        Object.defineProperties(this, {
            "children": {
                 "get": ()=>that.e.children,
                 "set": ()=>{}
            }
        });
    }
    return ELEM;
})();