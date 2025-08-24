import { SCREENWIDTH } from "./elements"

class GUIComponent {
    constructor(scene) {
        this.scene = scene
        this.states = {}
        this.defaultStyle = {color: 0x36454F, alpha:1}
        this.states["default"] = {}
        this.currentState = "default"
    }

    addContainer(startX, startY, endX, endY, name, state, setActiveState, style) {
        let appliedStyle
        if (style?.color && style?.alpha) {appliedStyle = style}
        else {appliedStyle = this.defaultStyle}

        let background = this.scene.add.graphics().fillStyle(appliedStyle.color, appliedStyle.alpha)
            
        let container = this.scene.add.container(startX, startY).setSize(endX, endY).add(background)
        if (!(state === this.currentState)) {container.setVisible(false).setActive(false)}

        background.fillRect(0, 0, endX - startX, endY - startY)

        if (!this.states[state]) {this.states[state] = {}} // Initializes a new state if it doesn't exist yet
        this.states[state][name] = container

        if (setActiveState === true) {this.setState(state)}

        return this
    }

    addChildren(element, containerName, state, x, y) {
        if (Array.isArray(element)) {
            for (let child of element) {
                this.states[state][containerName].add(child).setPosition(x, y)
            }
        }
        else {this.states[state][containerName].add(element).setPosition(x, y)}
        return this
    }

    toggleContainerVisibility(containerName, state, visible) {
        this.states[state][containerName].setVisible(visible).setActive(visible)
        return this
    }

    toggleChildVisibility(containerName, childID, state, visible) {
        if (Number.isInteger(childID)) {
            this.states[state][containerName].getAt(childID).visible = visible
        }
        else if (typeof childID === "string") {
            this.states[state][containerName].getByName(childID).visible = visible
        }
        return this
    }

    setState(newState) {
        if (!this.states[newState]) {console.log(`state ${newState} not found!`); return}

        for (let container of Object.keys(this.states[this.currentState])) {
            this.states[this.currentState][container].setVisible(false).setActive(false)
        }

        for (let container of Object.keys(this.states[newState])) {
            this.states[newState][container].setVisible(true).setActive(true)
        }
        this.currentState = newState
        return this
    }
}

class BattleGUI extends GUIComponent {
    constructor(scene) {
        super(scene)
        let layer = this.scene.curLayer

        const corner = this.addContainer(0, 0, layer.x - 32, scene.gameHeight, "leftCorner", "tacticalMap", true)
        this.addContainer(layer.x + layer.width + 32, 0, SCREENWIDTH, scene.gameHeight, "rightCorner", "tacticalMap")

        

    }

    setState(newState) {
        super.setState(newState)
        if (newState === "tacticalMap"){this.scene.toggleMapActivation(true)}
        else {this.scene.toggleMapActivation(false)}
    }

}


export {BattleGUI}