import { GameItemConfig } from "../DB/GameItemConfig";
import InstanceManager from "../Manager/InstanceManager";
import { Util } from "./Util";

class Grid {
    /**当前格子的列数 */
    x = 0;
    /**当前格子的列数 */
    y = 0;
    /**g+h 总消耗 */
    f = 0;
    /**起点移动到当前点的距离 */
    g = 0;
    /**当前点移动到目标点的距离 */
    h = 0;
    /**-1障碍物， 0正常， 1起点， 2目的点 */
    type = 0;

    isOccupied = false;

    parent = null;

    ctor() {//构造函数

    }
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class Astar extends cc.Component {
    extends: cc.Component;

    @property(cc.Graphics)
    map: cc.Graphics = null;

    @property(cc.Node)
    obstacleArr: cc.Node = null;

    _gridW = 60;   // 单元格子宽度
    _gridH = 60;   // 单元格子高度
    mapH = 13;     // 纵向格子数量
    mapW = 24;     // 横向格子数量
    is8dir = true; // 是否8方向寻路

    gridsList: Grid[][] = null;//格子列表 用来存放格子
    //openList = [];//开启列表 存放周围可到达的格子
    //closeList = [];//关闭列表 存放已经走过不需要再检查的格子
    // path: Grid[] = []//

    start() {
        this.mapH = Math.floor(this.node.height / this._gridH);
        this.mapW = Math.floor(this.node.width / this._gridW);
        this.initMap();
    }

    /*********************************************************************************
    * api
    *********************************************************************************/

    // clearAStar() {
    //     this.gridsList = [];
    //     this.openList = [];
    //     this.closeList = [];
    //     this.path = [];
    //     this.initMap();
    // }

    addOccupiedGrid_enemy(node: cc.Node, gridList: any[]) {
        this.removeOccupiedGrid_enemy(gridList);

        let leftEdge = node.x - node.width / 2;
        let rightEdge = node.x + node.width / 2;
        let topEdge = node.y + node.height;
        let bottomEdge = node.y;

        for (let n of this.gridsList) {
            for (let m of n) {
                let pos = Util.transformGridToGamePos(cc.v2(m.x, m.y));

                if (pos.x > leftEdge && pos.x < rightEdge && pos.y > bottomEdge && pos.y < topEdge) {
                    m.isOccupied = true;
                    this.draw(m.x, m.y, cc.Color.MAGENTA);
                    gridList.push(m);
                }
            }
        }
    }

    removeOccupiedGrid_enemy(gridList: any[]) {
        for (let n of gridList) {
            n.isOccupied = false;
        }
    }

    addOccupiedGrid(v2: cc.Vec2) {
        this.gridsList[this.getGrid(v2).x][this.getGrid(v2).y].isOccupied = true;

        this.draw(this.getGrid(v2).x, this.getGrid(v2).y, cc.Color.MAGENTA);
    }

    removeOccupiedGrid(v2: cc.Vec2) {
        this.gridsList[this.getGrid(v2).x][this.getGrid(v2).y].isOccupied = false;
    }

    getGrid(v2: cc.Vec2) {
        let x = Math.floor((v2.x + Math.abs(this.map.node.x)) / (this._gridW + 2));
        let y = Math.floor((v2.y + Math.abs(this.map.node.y)) / (this._gridH + 2));

        return cc.v2(x, y);
    }

    getStartPoint(v2: cc.Vec2) {
        let x = Math.floor((v2.x + Math.abs(this.map.node.x)) / (this._gridW + 2));
        let y = Math.floor((v2.y + Math.abs(this.map.node.y)) / (this._gridH + 2));

        this.gridsList[x][y].type = 1;
        this.draw(x, y, cc.Color.YELLOW);

        return cc.v2(x, y);
    }

    getEndPoint(v2: cc.Vec2) {
        let x = Math.floor((v2.x + Math.abs(this.map.node.x)) / (this._gridW + 2));
        let y = Math.floor((v2.y + Math.abs(this.map.node.y)) / (this._gridH + 2));

        this.gridsList[x][y].type = 2;
        this.draw(x, y, cc.Color.BLUE);

        return cc.v2(x, y);
    }


    /*********************************************************************************
     * AStar
     *********************************************************************************/
    // onLoad() {
    //     this.node.on('touchmove', this.onTouchMove.bind(this));
    //     this.node.on('touchend', this.onTouchEnd.bind(this));
    // }

    // onTouchMove(event) {
    //     let pos = event.getLocation();
    //     let x = Math.floor(pos.x / (this._gridW + 2));
    //     let y = Math.floor(pos.y / (this._gridH + 2));
    //     if (this.gridsList[x][y].type == 0) {
    //         this.gridsList[x][y].type = -1;
    //         this.draw(x, y, cc.Color.RED);
    //     }
    //     cc.log(x + "," + y);
    // }

    // onTouchEnd() {
    //     console.log("开始寻路");
    //     // 开始寻路
    //     this.findPath();
    // }


    initMap() {
        // 初始化格子二维数组
        this.gridsList = new Array(this.mapW + 1);
        for (let col = 0; col < this.gridsList.length; col++) {
            this.gridsList[col] = new Array(this.mapH + 1);
        }

        this.map.clear();
        for (let col = 0; col <= this.mapW; col++) {
            for (let row = 0; row <= this.mapH; row++) {
                this.draw(col, row);
                this.addGrid(col, row, 0);
            }
        }

        this.addObstacle();
    }

    /**添加障碍物 */
    addObstacle() {
        for (let n of this.obstacleArr.children) {
            let leftEdge = n.x;
            let rightEdge = n.x + n.width;
            let topEdge = n.y + n.height;
            let bottomEdge = n.y;

            for (let n of this.gridsList) {
                for (let m of n) {
                    let pos = Util.transformGridToGamePos(cc.v2(m.x, m.y));

                    if (pos.x > leftEdge && pos.x < rightEdge && pos.y > bottomEdge && pos.y < topEdge) {
                        m.type = -1;
                        this.draw(m.x, m.y, cc.Color.RED);
                    }
                }

            }
        }
    }

    /**添加格子 */
    addGrid(x, y, type) {
        let grid = new Grid();
        grid.x = x;
        grid.y = y;
        grid.type = type;
        this.gridsList[x][y] = grid;
    }

    _sortFunc(x, y) {
        return x.f - y.f;
    }

    generatePath(grid, pathArr: Grid[]) {
        pathArr.push(grid);
        while (grid.parent) {
            grid = grid.parent;
            pathArr.push(grid);
        }
        // cc.log("path.length: " + pathArr.length);
        for (let i = 0; i < pathArr.length; i++) {
            // 起点终点不覆盖，方便看效果
            if (i != 0 && i != pathArr.length - 1) {
                let grid = pathArr[i];

                if (grid.isOccupied) {
                    this.draw(grid.x, grid.y, cc.Color.MAGENTA);
                }
                else {
                    this.draw(grid.x, grid.y, cc.Color.GREEN);
                }

            }
        }
    }


    /**
     * 寻路
     * @param startPos 起点
     * @param endPos 终点
     * @param pathArr 存放路径格子
     * @param openList 开启列表 存放周围可到达的格子
     * @param closeList 关闭列表 存放已经走过不需要再检查的格子
     * @returns 
     */
    findPath(startPos: cc.Vec2, endPos: cc.Vec2, pathArr, openList, closeList) {
        //获得起点与终点对应的格子数组的下标
        this.map.clear();
        for (let n of this.gridsList) {
            for (let m of n) {

                if (m.type == -1) {
                    this.draw(m.x, m.y, cc.Color.RED);
                }
                else {
                    m.type = 0;
                    this.draw(m.x, m.y);
                }

                if (m.isOccupied) {
                    this.draw(m.x, m.y, cc.Color.MAGENTA);
                }


                m.f = 0;
                m.g = 0;
                m.h = 0;

                m.parent = null;
            }
        }
        startPos = this.getStartPoint(startPos);
        endPos = this.getEndPoint(endPos);

        let startGrid = this.gridsList[startPos.x][startPos.y];
        let endGrid = this.gridsList[endPos.x][endPos.y];

        openList.push(startGrid);
        let curGrid: Grid = openList[0];
        while (openList.length > 0 && curGrid.type != 2 && curGrid != endGrid) {
            // 每次都取出f值最小的节点进行查找
            curGrid = openList[0];
            if (curGrid.type == 2 && curGrid == endGrid) {//可用于多个目标点的寻路
                this.generatePath(curGrid, pathArr);
                return;
            }

            for (let i = -1; i <= 1; i++) {//单位是格子列表的行、列
                for (let j = -1; j <= 1; j++) {
                    if (i != 0 || j != 0) {//3*3的格子排除中心点
                        let col = curGrid.x + i;
                        let row = curGrid.y + j;
                        if (col >= 0 && row >= 0 && col <= this.mapW && row <= this.mapH//排除地图之外、障碍物、走过的格子
                            && this.gridsList[col][row].type != -1 //&& this.gridsList[col][row].isOccupied == false
                            && closeList.indexOf(this.gridsList[col][row]) < 0) {
                            if (this.is8dir) {
                                // 8方向 斜向走动时要考虑相邻的是不是障碍物
                                if (this.gridsList[col - i][row].type == -1 || this.gridsList[col][row - j].type == -1) {
                                    continue;
                                }
                            } else {
                                // 四方形行走
                                if (Math.abs(i) == Math.abs(j)) {
                                    continue;
                                }
                            }

                            // 计算g值 i,j就是检查点与起点的距离
                            let g = curGrid.g + parseInt(Math.sqrt(Math.pow(i, 2) + Math.pow(j, 2)).toString());// * 10
                            if (this.gridsList[col][row].g == 0 || this.gridsList[col][row].g > g) {
                                this.gridsList[col][row].g = g;
                                // 更新父节点
                                this.gridsList[col][row].parent = curGrid;
                            }
                            // 计算h值 manhattan估算法   横向距离加上纵向距离
                            this.gridsList[col][row].h = Math.abs(endPos.x - col) + Math.abs(endPos.y - row);
                            // 更新f值
                            this.gridsList[col][row].f = this.gridsList[col][row].g + this.gridsList[col][row].h;
                            // 如果不在开放列表里则添加到开放列表里
                            if (openList.indexOf(this.gridsList[col][row]) < 0) {
                                openList.push(this.gridsList[col][row]);
                            }
                            // // 重新按照f值排序（升序排列)
                            // this.openList.sort(this._sortFunc);
                        }
                    }
                }
            }
            // 遍历完四周节点后把当前节点加入关闭列表
            closeList.push(curGrid);
            // 从开放列表把当前节点移除
            openList.splice(openList.indexOf(curGrid), 1);
            if (openList.length <= 0) {
                cc.log("find path failed.");
            }

            // 重新按照f值排序（升序排列)
            openList.sort(this._sortFunc);
        }
    }

    draw(col, row, color?: cc.Color) {
        if (!GameItemConfig.isTest) {
            return;
        }
        if (!color) {
            color = cc.Color.GRAY;
            color.a = 100;
        }
        // color = color != undefined ? color : cc.Color.GRAY;



        this.map.fillColor = color;
        let posX = 2 + col * (this._gridW + 2);
        let posY = 2 + row * (this._gridH + 2);
        //绘制矩形
        this.map.fillRect(posX, posY, this._gridW, this._gridH);
    }


    findClosedGrid(startPos: cc.Vec2, endPos: cc.Vec2, openList, closeList): Grid {
        //获得起点与终点对应的格子数组的下标
        let startGrid = this.getGrid(endPos);
        let endGrid = this.getGrid(startPos);

        openList.push(this.gridsList[startGrid.x][startGrid.y]);
        let curGrid: Grid = openList[0];
        while (openList.length > 0 && curGrid.type == -1 || openList.length > 0 && curGrid.isOccupied == true) {
            // 每次都取出f值最小的节点进行查找
            curGrid = openList[0];

            if (curGrid == this.gridsList[endGrid.x][endGrid.y]) {//可用于多个目标点的寻路
                let pathArr = [];
                pathArr.push(curGrid);
                while (curGrid.parent) {
                    curGrid = curGrid.parent;
                    pathArr.push(curGrid);
                }

                return pathArr[pathArr.length - 1];
            }

            // if (curGrid.type != -1 && curGrid.isOccupied == false) {

            // }

            for (let i = -1; i <= 1; i++) {//单位是格子列表的行、列
                for (let j = -1; j <= 1; j++) {
                    if (i != 0 || j != 0) {//3*3的格子排除中心点
                        let col = curGrid.x + i;
                        let row = curGrid.y + j;
                        if (col >= 0 && row >= 0 && col <= this.mapW && row <= this.mapH//排除地图之外、障碍物、走过的格子
                            && this.gridsList[col][row].type != -1 && this.gridsList[col][row].isOccupied == false
                            && closeList.indexOf(this.gridsList[col][row]) < 0) {
                            if (this.is8dir) {
                                // 8方向 斜向走动时要考虑相邻的是不是障碍物
                                if (this.gridsList[col - i][row].type == -1 || this.gridsList[col][row - j].type == -1) {
                                    continue;
                                }
                            } else {
                                // 四方形行走
                                if (Math.abs(i) == Math.abs(j)) {
                                    continue;
                                }
                            }

                            // 计算g值 i,j就是检查点与起点的距离
                            let g = curGrid.g + parseInt(Math.sqrt(Math.pow(i, 2) + Math.pow(j, 2)).toString());// * 10
                            if (this.gridsList[col][row].g == 0 || this.gridsList[col][row].g > g) {
                                this.gridsList[col][row].g = g;
                                // 更新父节点
                                this.gridsList[col][row].parent = curGrid;
                            }
                            // 计算h值 manhattan估算法   横向距离加上纵向距离
                            this.gridsList[col][row].h = Math.abs(endGrid.x - col) + Math.abs(endGrid.y - row);
                            // 更新f值
                            this.gridsList[col][row].f = this.gridsList[col][row].g + this.gridsList[col][row].h;
                            // 如果不在开放列表里则添加到开放列表里
                            if (openList.indexOf(this.gridsList[col][row]) < 0) {
                                openList.push(this.gridsList[col][row]);
                            }
                        }
                    }
                }
            }

            // 遍历完四周节点后把当前节点加入关闭列表
            closeList.push(curGrid);
            // 从开放列表把当前节点移除
            openList.splice(openList.indexOf(curGrid), 1);
            if (openList.length <= 0) {
                cc.log("find path failed.");
            }

            // 重新按照f值排序（升序排列)
            openList.sort(this._sortFunc);
        }
    }

}
