// This script is used to extract body components made in figma

import fs from "fs";
import fetch from "node-fetch";
import "dotenv/config";

const FILE_ID = process.env.FILE_ID; 
const TOKEN  = process.env.FIGMA_TOKEN; 

function extractLayers(node) {
    let bodyParts = [];
    const bodypartTypes = ["RECTANGLE", "ELLIPSE"];

    // Process current node if it matches criteria
    if (bodypartTypes.includes(node.type) && node.name !== "sprite") {
        let rotationDeg = node.rotation || 0;

        if (Math.abs(rotationDeg) < 0.001) {rotationDeg = 0;}
        const info = {
            type: node.type,
            name: node.name,
            rotation: rotationDeg * (Math.PI / 180),
        };
        Object.assign(info, node.absoluteBoundingBox);
        bodyParts.push(info);
    }

    // Recursively process children
    if (node.children) {
        for (const child of node.children) {
            bodyParts.push(...extractLayers(child));
        }
    }

    return bodyParts;
}

function adjustCoordinates(bodyParts) {
    const torso = bodyParts.find(part => part.name === 'torso');
    
    if (!torso) {
        console.warn("Warning: No torso found. Coordinates will not be adjusted.");
        return bodyParts;
    }

    // Adjust coordinates relative to torso
    return bodyParts.map(part => ({
        ...part,
        x: part.x - torso.x,
        y: part.y - torso.y
    }));
}

async function main() {
    try {
        const res = await fetch(`https://api.figma.com/v1/files/${FILE_ID}`, {
            headers: { "X-Figma-Token": TOKEN }
        });

        if (!res.ok) {
            throw new Error(`Figma API error: ${res.status} ${res.statusText}`);
        }

        const file = await res.json();
        let allLayers = extractLayers(file.document);
        
        // Adjust coordinates relative to torso
        allLayers = adjustCoordinates(allLayers);

        fs.writeFileSync("layers.json", JSON.stringify(allLayers, null, 2));
        console.log(`Extracted ${allLayers.length} layers to layers.json`);
    } catch (err) {
        console.error("Error:", err.message);
    }
}

main();