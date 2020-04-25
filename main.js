const electron = require('electron')
const url = require('url')
const path = require('path')
const _ = require('lodash')

const {app, BrowserWindow, Menu, ipcMain} = electron

process.env.NODE_ENV = 'production'

let mainWindow, itemWindow, editWindow, itemList=[]

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
        app.quit()
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
    itemWindow.webContents.send('item:refresh', itemList)
})

const mainMenuTemplate = [
    {
        label: 'Atur Barang',
        click(){
            createItemWindow()
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