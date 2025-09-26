/**
 * 簡化版雲端儲存功能模組
 * 暫時不使用 Google Drive API，改用本地儲存 + 未來可擴展的架構
 */

class CloudStorage {
    constructor() {
        this.isInitialized = false;
        this.isCloudEnabled = false; // 目前關閉雲端功能
        console.log('CloudStorage: 使用本地儲存模式');
    }

    /**
     * 初始化儲存系統
     */
    async init() {
        if (this.isInitialized) {
            return;
        }

        // 檢查用戶登入狀態
        const user = getCurrentUser();
        if (!user) {
            throw new Error('用戶未登入');
        }

        // 標記為已初始化（本地模式）
        this.isInitialized = true;
        console.log('✅ 本地儲存系統初始化成功');
        
        return Promise.resolve();
    }

    /**
     * 儲存遊戲資料
     */
    async saveGameData(gameId, data) {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('用戶未登入');
        }

        // 準備檔案內容
        const fileContent = {
            gameId: gameId,
            userId: user.sub,
            userName: user.name,
            userEmail: user.email,
            data: data,
            lastModified: new Date().toISOString(),
            version: '2.0',
            storageType: 'local'
        };

        // 儲存到本地
        const storageKey = `CloudStorage_${gameId}_${user.sub}`;
        localStorage.setItem(storageKey, JSON.stringify(fileContent));
        
        console.log('✅ 資料已儲存到本地儲存');
        return { action: 'saved_locally', gameId, userId: user.sub };
    }

    /**
     * 載入遊戲資料
     */
    async loadGameData(gameId) {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('用戶未登入');
        }

        const storageKey = `CloudStorage_${gameId}_${user.sub}`;
        const savedData = localStorage.getItem(storageKey);
        
        if (!savedData) {
            console.log('沒有找到儲存的資料');
            return null;
        }

        try {
            const fileContent = JSON.parse(savedData);
            
            // 驗證資料所有者
            if (fileContent.userId !== user.sub) {
                throw new Error('無權限存取此檔案');
            }

            console.log('✅ 從本地儲存載入資料');
            return fileContent;
        } catch (error) {
            console.error('解析儲存資料失敗:', error);
            return null;
        }
    }

    /**
     * 刪除遊戲資料
     */
    async deleteGameData(gameId) {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('用戶未登入');
        }

        const storageKey = `CloudStorage_${gameId}_${user.sub}`;
        localStorage.removeItem(storageKey);
        
        console.log('✅ 資料已從本地儲存移除');
        return true;
    }

    /**
     * 檢查 Drive API 權限（暫時返回 false）
     */
    async checkDrivePermission() {
        return false;
    }

    /**
     * 請求 Drive API 權限（暫時不實作）
     */
    async requestDrivePermission() {
        console.log('雲端同步功能暫未開放');
        return false;
    }

    /**
     * 獲取存取令牌（暫時不實作）
     */
    getAccessToken() {
        throw new Error('雲端功能暫未開放');
    }

    /**
     * 檢查是否支援雲端同步
     */
    isCloudSyncAvailable() {
        return this.isCloudEnabled;
    }

    /**
     * 獲取儲存狀態資訊
     */
    getStorageInfo() {
        const user = getCurrentUser();
        if (!user) {
            return { type: 'none', message: '未登入' };
        }

        return {
            type: 'local',
            message: '本地儲存',
            userId: user.sub,
            userName: user.name
        };
    }
}