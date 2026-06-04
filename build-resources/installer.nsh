; Optional NSIS customisations. Uncomment to add a firewall rule on install.
;
; !macro customInstall
;   nsExec::ExecToLog 'netsh advfirewall firewall add rule name="PLC Dialer Dash" dir=out action=allow protocol=TCP remoteport=102'
; !macroend
; !macro customUnInstall
;   nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="PLC Dialer Dash"'
; !macroend
