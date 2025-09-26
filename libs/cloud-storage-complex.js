/**
 * 雲端儲存功能模組 - 使用 Google Drive API (僅使用 Client ID)
 */

class CloudStorage {
    constructor() {
        this.isInitialized = false;
        this.clientId = '344978275183-2ilbkaf574jtufunu1hbu5c8tion3t9q.apps.googleusercontent.com';
        this.scope = 'https://www.googleapis.com/auth/drive.file';
        this.accessToken = null;
    }

    /**
     * 初始化 Google Drive API - 使用新的 Google Identity Services
     */
    async init() {
        if (this.isInitialized) {
            return;
        }

        return new Promise((resolve, reject) => {
            // 確保用戶已登入
            const user = getCurrentUser();
            if (!user) {
                reject(new Error('用戶未登入'));
                return;
            }

            // 等待 gapi 載入
            const waitForGapi = () => {
                if (typeof gapi !== 'undefined') {
                    // 僅載入 client，不使用已棄用的 auth2
                    gapi.load('client', async () => {
                        try {
                            // 初始化 client （不包含 auth）
                            await gapi.client.init({
                                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
                            });

                            console.log('gapi client 初始化完成，準備請求 Drive 權限');
                            
                            // 等待 Google Identity Services 載入
                            await this.waitForGoogleIdentity();
                            
                            // 使用 Google Identity Services 獲取 access token
                            await this.requestAccessToken();

                            this.isInitialized = true;
                            console.log('Google Drive API 初始化成功');
                            resolve();
                        } catch (error) {
                            console.error('Google Drive API 初始化失敗:', error);
                            reject(error);
                        }
                    });
                } else {
                    // 如果 gapi 還沒載入，等待 100ms 後重試
                    setTimeout(waitForGapi, 100);
                }
            };

            waitForGapi();
        });
    }

    /**
     * 等待 Google Identity Services 載入
     */
    async waitForGoogleIdentity() {
        return new Promise((resolve, reject) => {
            const checkGoogleIdentity = () => {
                if (typeof google !== 'undefined' && 
                    google.accounts && 
                    google.accounts.oauth2) {
                    console.log('Google Identity Services 已載入');
                    resolve();
                } else {
                    // 每 100ms 檢查一次，最多等待 10 秒
                    setTimeout(checkGoogleIdentity, 100);
                }
            };

            checkGoogleIdentity();
            
            // 10 秒超時
            setTimeout(() => {
                reject(new Error('Google Identity Services 載入超時'));
            }, 10000);
        });
    }

    /**
     * 使用 Google Identity Services 請求 access token
     */
    async requestAccessToken() {
        return new Promise((resolve, reject) => {
            try {
                // 檢查 google 物件是否可用
                if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
                    reject(new Error('Google Identity Services 未載入'));
                    return;
                }

                // 使用 Google Identity Services 的 OAuth2 流程
                const tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: this.clientId,
                    scope: this.scope,
                    callback: (response) => {
                        console.log('OAuth 回應:', response);
                        
                        if (response.error) {
                            console.error('Token 請求失敗:', response);
                            reject(new Error(response.error_description || response.error));
                        } else if (response.access_token) {
                            this.accessToken = response.access_token;
                            console.log('Access Token 獲取成功');
                            resolve(response.access_token);
                        } else {
                            reject(new Error('未收到有效的 access token'));
                        }
                    },
                    error_callback: (error) => {
                        console.error('OAuth 錯誤回調:', error);
                        reject(new Error(error.message || 'OAuth 授權失敗'));
                    }
                });

                // 請求 token，使用較簡單的設定
                tokenClient.requestAccessToken({
                    prompt: '' // 移除強制同意，讓 Google 決定
                });
                
            } catch (error) {
                console.error('初始化 Token Client 失敗:', error);
                reject(error);
            }
        });
    }

    /**
     * 獲取當前的訪問令牌
     */
    getAccessToken() {
        if (!this.accessToken) {
            throw new Error('Access Token 不存在，請先初始化');
        }
        return this.accessToken;
    }

    /**
     * 儲存遊戲資料到 Google Drive
     */
    async saveGameData(gameId, data) {
        try {
            // 檢查登入狀態
            const user = getCurrentUser();
            if (!user) {
                throw new Error('用戶未登入');
            }

            // 初始化 API
            await this.init();

            // 準備檔案內容
            const fileContent = {
                gameId: gameId,
                userId: user.sub,
                userName: user.name,
                userEmail: user.email,
                data: data,
                lastModified: new Date().toISOString(),
                version: '1.0'
            };

            // 檢查是否已存在檔案
            const existingFile = await this.findGameFile(gameId, user.sub);
            
            if (existingFile) {
                // 更新現有檔案
                await this.updateFile(existingFile.id, fileContent);
                return { action: 'updated', fileId: existingFile.id };
            } else {
                // 創建新檔案
                const result = await this.createFile(gameId, user.sub, fileContent);
                return { action: 'created', fileId: result.id };
            }
        } catch (error) {
            console.error('儲存資料失敗:', error);
            throw error;
        }
    }

    /**
     * 從 Google Drive 載入遊戲資料
     */
    async loadGameData(gameId) {
        try {
            const user = getCurrentUser();
            if (!user) {
                throw new Error('用戶未登入');
            }

            await this.init();

            const file = await this.findGameFile(gameId, user.sub);
            if (!file) {
                return null; // 檔案不存在
            }

            // 下載檔案內容
            const response = await gapi.client.drive.files.get({
                fileId: file.id,
                alt: 'media'
            });

            const fileContent = JSON.parse(response.body);
            
            // 驗證檔案是否屬於當前用戶
            if (fileContent.userId !== user.sub) {
                throw new Error('無權限存取此檔案');
            }

            return fileContent;
        } catch (error) {
            console.error('載入資料失敗:', error);
            throw error;
        }
    }

    /**
     * 尋找遊戲檔案
     */
    async findGameFile(gameId, userId) {
        const fileName = `MarvelChampions_${gameId}_${userId}.json`;
        
        try {
            const response = await gapi.client.drive.files.list({
                q: `name='${fileName}' and trashed=false`,
                spaces: 'drive',
                fields: 'files(id, name, modifiedTime)'
            });

            return response.result.files.length > 0 ? response.result.files[0] : null;
        } catch (error) {
            console.error('尋找檔案失敗:', error);
            return null;
        }
    }

    /**
     * 創建新檔案
     */
    async createFile(gameId, userId, content) {
        const fileName = `MarvelChampions_${gameId}_${userId}.json`;
        const accessToken = this.getAccessToken();
        
        const metadata = {
            name: fileName
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        form.append('file', new Blob([JSON.stringify(content, null, 2)], {type: 'application/json'}));

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            body: form
        });

        if (!response.ok) {
            throw new Error(`檔案創建失敗: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * 更新現有檔案
     */
    async updateFile(fileId, content) {
        const accessToken = this.getAccessToken();
        
        const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(content, null, 2)
        });

        if (!response.ok) {
            throw new Error(`檔案更新失敗: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * 刪除遊戲檔案
     */
    async deleteGameData(gameId) {
        try {
            const user = getCurrentUser();
            if (!user) {
                throw new Error('用戶未登入');
            }

            await this.init();
            
            const file = await this.findGameFile(gameId, user.sub);
            if (file) {
                const accessToken = this.getAccessToken();
                
                const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                return response.ok;
            }
            return false;
        } catch (error) {
            console.error('刪除資料失敗:', error);
            throw error;
        }
    }

    /**
     * 檢查 Drive API 權限
     */
    async checkDrivePermission() {
        return this.accessToken !== null;
    }

    /**
     * 請求 Drive API 權限
     */
    async requestDrivePermission() {
        try {
            await this.requestAccessToken();
            return true;
        } catch (error) {
            console.error('請求權限失敗:', error);
            return false;
        }
    }
}