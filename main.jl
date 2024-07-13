using Pkg
Pkg.activate(@__DIR__)
Pkg.instantiate()

using JuliaWorkspaces
using JuliaWorkspaces.URIs2: uri2filepath

function esc_data(s)
    s = replace(s, '%' => "%25")
    s = replace(s, '\r' => "%0D")
    s = replace(s, '\n' => "%0A")
    return s
end

jw = workspace_from_folders([pwd()])

files = get_text_files(jw)

global fail_lint_pass = false

for file in files
    text_file = get_text_file(jw, file)

    diagnostics = get_diagnostic(jw, file)
    for diag in diagnostics
        if diag.severity == :error || diag.severity == :warning
            

            start_pos = position_at(text_file.content, diag.range.start)
            end_pos = position_at(text_file.content, diag.range.stop)

            println("::$(diag.severity) file=$(uri2filepath(file)),line=$(start_pos[1]),endLine=$(end_pos[1]),col=$(start_pos[2]),endColumn=$(end_pos[2]),title=$(esc_data(diag.source))::$(esc_data(diag.message))")
        end

        if diag.severity == :error
            global fail_lint_pass = true
        end
    end

    testitems = get_test_items(jw, file)
    for testerror in testitems.testerrors
        start_pos = position_at(text_file.content, testerror.range.start)
        end_pos = position_at(text_file.content, testerror.range.stop)
        println("::error file=$(uri2filepath(file)),line=$(start_pos[1]),endLine=$(end_pos[1]),col=$(start_pos[2]),endColumn=$(end_pos[2]),title=Testitems::$(esc_data(testerror.message))")
    end
end

if fail_lint_pass
    exit(1)
end
