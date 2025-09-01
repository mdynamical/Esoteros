import { SCREENHEIGHT, SCREENWIDTH } from "./elements"

class GUIComponent {
    constructor(scene) {
        this.scene = scene
        this.states = { default: { containers: {} }, fightMode: { containers: {} }};
        this.defaultStyle = {color: 0x36454F, alpha:1}
        this.currentState = "default"
    }

    addContainer(startX, startY, endX, endY, name, state, setActiveState, style) {
        let appliedStyle
        if (style?.color && style?.alpha) {appliedStyle = style}
        else {appliedStyle = this.defaultStyle}

        let background = this.scene.add.graphics().fillStyle(appliedStyle.color, appliedStyle.alpha)
            
        let container = this.scene.add.container(startX, startY).setSize(endX, endY).add(background)
        if (!(state === this.currentState)) {container.setVisible(false).setActive(false)}

        background.fillRect(0, 0, container.width, container.height)

        if (!this.states[state]) {this.states[state] = {containers: {}}} // Initializes a new state if it doesn't exist yet
        this.states[state]["containers"][name] = container

        if (setActiveState === true) {this.setState(state)}

        return this
    }

    toggleContainerVisibility(containerName, state, visible) {
        if (!this.states[state]?.containers?.[containerName]) {
        console.warn(`Container ${containerName} in state ${state} not found!`);
        return this;
        }

        this.states[state]["containers"][containerName].setVisible(visible).setActive(visible)
        return this
    }

    toggleChildVisibility(containerName, childID, state, visible) {
        if (Number.isInteger(childID)) {
            this.states[state]["containers"][containerName].getAt(childID).visible = visible
        }
        else if (typeof childID === "string") {
            this.states[state]["containers"][containerName].getByName(childID).visible = visible
        }
        return this
    }

    setState(newState) {
        if (!this.states[newState]) {console.log(`state ${newState} not found!`); return}

        for (let container of Object.keys(this.states[this.currentState]["containers"])) {
            this.states[this.currentState]["containers"][container].setVisible(false).setActive(false)
        }

        for (let container of Object.keys(this.states[newState]["containers"])) {
            this.states[newState]["containers"][container].setVisible(true).setActive(true)
        }

        this.currentState = newState
        if (this.states[newState].onChange) {this.states[newState].onChange()}

        return this
    }

    onStateChange(state, callback) {
        if (this.states[state]) {this.states[state].onChange = callback}
        else {console.log(`state ${state} not found!`)}
        return this
    }

}

class BattleGUI extends GUIComponent {
    constructor(scene) {
        super(scene)
        let layer = this.scene.curLayer
        const style = this.scene.defaultStyles.defaultTile
        const borderStyle = this.scene.defaultStyles.defaultBorder

        //tacticalMap
        this.addContainer(0, 0, layer.x - 32, scene.gameHeight, "leftCorner", "tacticalMap", true)
        this.addContainer(layer.x + layer.width + 32, 0, SCREENWIDTH, scene.gameHeight, "rightCorner", "tacticalMap")

        const tacticalMapCallback = () => this.scene.toggleMapActivation(true)
        this.onStateChange("tacticalMap", tacticalMapCallback)

        const leftCorner = this.states["tacticalMap"]["containers"]["leftCorner"]
        const testRect = this.scene.add.rectangle(leftCorner.width/2, leftCorner.height/2, 200,200, style.tint, style.alpha)
        .setStrokeStyle(borderStyle.size, borderStyle.tint).setInteractive().on('pointerdown', () => this.setState("fightMode"))
        leftCorner.add(testRect)
        // (^)StartX and Y of rect should be the desired position inside the container. For a 500x500 container a 250x250 position
        // Would be at the middle of the container, the following 2 parameters are the width and height of the rect
        
        //fightMode   
        const fightModeCallback = () => {
            this.scene.toggleMapActivation(false)
            if (!this.scene.actors[1].body.screenRects) {
                this.scene.actors[1].body.activateBody(SCREENWIDTH/2, SCREENHEIGHT/2)
                console.log("active")
            }
        }

        this.onStateChange("fightMode", fightModeCallback)

    }

    tacticalMap () {

    }

    fightMode() {
        
    }

}


export {BattleGUI}