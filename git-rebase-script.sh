#!/bin/bash

# 創建一個暫存檔案來存儲 rebase 指令
cat > /tmp/rebase-commands.txt << 'EOF'
pick 2a4fa91 temp
pick 57beb9c temp2
pick 5e10a97 temp3
pick e46f2a7 temp4
pick bca07c2 temp4
pick 259f180 temp5
pick 93efb64 temp6
pick 7870338 temp7
pick 3c8c833 temp8
pick 0a2078e temp9
pick c31a98d aa
pick f39f790 fix multi-seletion bug
pick 7a7bd05 imrpove event safety in canvas
EOF

# 將 pick 改為 reword
sed -i 's/^pick/reword/g' /tmp/rebase-commands.txt

echo "Rebase 指令已準備好"
cat /tmp/rebase-commands.txt