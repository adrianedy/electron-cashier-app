const electron = require('electron')
const url = require('url')
const path = require('path')
const _ = require('lodash')
const fs = require('fs')

const {app, BrowserWindow, Menu, ipcMain} = electron

process.env.NODE_ENV = 'production'

let mainWindow, itemWindow, editWindow, historyWindow, itemList = [], history = []

fs.readFile("db_item.json", (err, jsonItem) => {
    if(!err) {
        itemList = JSON.parse(jsonItem)
    }
})

fs.readFile("db_history.json", (err, jsonHistory) => {
    if(!err) {
        history = JSON.parse(jsonHistory)
    }
})

app.on('ready', function (){
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    })

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    mainWindow.on('closed', function(){
        fs.writeFileSync('db_item.json', JSON.stringify(itemList))
        fs.writeFileSync('db_history.json', JSON.stringify(history))

        app.quit()
        mainWindow = null
    })

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)

    Menu.setApplicationMenu(mainMenu)
})

function createItemWindow(){
    itemWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    })
    itemWindow.setMenu(null)
    
    itemWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'item.html'),
        protocol: 'file:',
        slashes: true
    }))

    itemWindow.on('close', function(){
        itemWindow = null
    })
}

function createEditWindow(){
    editWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: 300,
        height: 350,
        title: 'Edit Barang'
    })
    editWindow.setMenu(null)
    
    editWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'edit.html'),
        protocol: 'file:',
        slashes: true
    }))

    editWindow.on('close', function(){
        editWindow = null
    })
}

function createHistoryWindow(){
    historyWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    })
    historyWindow.setMenu(null)
    
    historyWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'history.html'),
        protocol: 'file:',
        slashes: true
    }))

    historyWindow.on('close', function(){
        historyWindow = null
    })
}

ipcMain.on('item:add', function(e, item){
    itemList.push(item)
    itemWindow.webContents.send('item:refresh', itemList)
    mainWindow.webContents.send('item:refresh', itemList)
})

ipcMain.on('item:edit', function(e, item){
    createEditWindow()
    item = _.find(itemList, ['id', item])
    
    editWindow.webContents.on('did-finish-load', function(){
        editWindow.webContents.send('item:edit', item)
    })
})

ipcMain.on('item:update', function(e, item){
    let index = _.findIndex(itemList, {id: item.id})
    itemList.splice(index, 1, item)
    
    itemWindow.webContents.send('item:refresh', itemList)
    mainWindow.webContents.send('item:refresh', itemList)
    editWindow.close()
})

ipcMain.on('item:delete', function(e, item){
    _.remove(itemList, {
        id: item
    });
    itemWindow.webContents.send('item:refresh', itemList)
    mainWindow.webContents.send('item:refresh', itemList)
})

ipcMain.on('item:refresh', function(e, item){
    mainWindow.webContents.send('item:refresh', itemList)
    if (itemWindow) {
        itemWindow.webContents.send('item:refresh', itemList)
    }
})

ipcMain.on('item-list:update', function(e, updateList){
    itemList = updateList
    mainWindow.webContents.send('item:refresh', itemList)
    if (itemWindow) {
        itemWindow.webContents.send('item:refresh', itemList)
    }
})

ipcMain.on('history:refresh', function(e, item){
    historyWindow.webContents.send('history:refresh', history)
})

ipcMain.on('order:save', function(e, cart){
    history = _.concat(history, cart)
    if (historyWindow) {
        historyWindow.webContents.send('history:refresh', history)
    }
})

const mainMenuTemplate = [
    {
        label: 'Atur Barang',
        click(){
            createItemWindow()
        }
    },
    {
        label: 'History',
        click(){
            createHistoryWindow()
        }
    },
]

if (process.platform == 'darwin')  {
    mainMenuTemplate.unshift({})
}

if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools()
                }
            },
            {
                role: 'reload'
            }
        ]
    })
}